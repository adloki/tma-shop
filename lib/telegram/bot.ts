import { Bot, InlineKeyboard } from "grammy";

import { env } from "@/lib/env";
import {
  getOrderById,
  getProductDelivery,
  markOrderPaid,
  validateOrderForCheckout,
} from "@/lib/orders";
import { getWebAppUrl } from "@/lib/telegram/webapp-url";

const globalForBot = globalThis as typeof globalThis & {
  __tmaShopBot?: Bot;
};

function createBot(): Bot {
  const bot = new Bot(env.BOT_TOKEN);

  bot.catch((error) => {
    console.error("[telegram-bot]", error);
  });

  bot.command("shop", async (ctx) => {
    const keyboard = new InlineKeyboard().webApp("🛒 Открыть магазин", getWebAppUrl());

    await ctx.reply("Добро пожаловать в магазин! Нажмите кнопку ниже, чтобы открыть каталог.", {
      reply_markup: keyboard,
    });
  });

  bot.on("pre_checkout_query", async (ctx) => {
    const query = ctx.preCheckoutQuery;
    const order = await getOrderById(query.invoice_payload);

    if (!order) {
      await ctx.answerPreCheckoutQuery(false, {
        error_message: "Заказ не найден",
      });
      return;
    }

    const validation = validateOrderForCheckout(order, {
      userId: query.from.id,
      currency: query.currency,
      totalAmount: query.total_amount,
      invoicePayload: query.invoice_payload,
    });

    if (!validation.ok) {
      await ctx.answerPreCheckoutQuery(false, {
        error_message: validation.reason,
      });
      return;
    }

    await ctx.answerPreCheckoutQuery(true);
  });

  bot.on("message:successful_payment", async (ctx) => {
    const payment = ctx.message.successful_payment;
    const orderId = payment.invoice_payload;
    const chatId = ctx.chat?.id;

    if (!chatId) {
      console.error("[telegram-bot] successful_payment without chat id");
      return;
    }

    const order = await getOrderById(orderId);
    if (!order) {
      await ctx.reply("Оплата получена, но заказ не найден. Напишите в поддержку.");
      return;
    }

    if (order.status === "paid") {
      await ctx.reply("Оплата уже была обработана ранее.");
      return;
    }

    const updated = await markOrderPaid(
      order.id,
      payment.telegram_payment_charge_id,
    );

    if (!updated) {
      await ctx.reply("Не удалось обновить статус заказа. Мы уже разбираемся.");
      return;
    }

    const product = await getProductDelivery(order.product_id);

    if (product?.delivery_file_id) {
      await ctx.api.sendDocument(chatId, product.delivery_file_id, {
        caption: `✅ Оплата прошла! «${product.name}»`,
      });
      return;
    }

    if (product?.delivery_file_url) {
      await ctx.api.sendDocument(chatId, product.delivery_file_url, {
        caption: `✅ Оплата прошла! «${product.name}»`,
      });
      return;
    }

    await ctx.reply(
      `✅ Оплата прошла! Заказ «${product?.name ?? order.product_id}» оплачен.\n\nФайл для выдачи не настроен в каталоге.`,
    );
  });

  return bot;
}

export function getBot(): Bot {
  if (!globalForBot.__tmaShopBot) {
    globalForBot.__tmaShopBot = createBot();
  }
  return globalForBot.__tmaShopBot;
}

export async function handleTelegramWebhook(request: Request): Promise<Response> {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (secret) {
    const header = request.headers.get("x-telegram-bot-api-secret-token");
    if (header !== secret) {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  try {
    const update = await request.json();
    await getBot().handleUpdate(update);
    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("[telegram-webhook]", error);
    return new Response("Webhook handler error", { status: 500 });
  }
}
