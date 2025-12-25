import {
  ButtonStyle,
  ButtonBuilder,
  ChatInputCommandInteraction,
  MessageFlags,
  SlashCommandBuilder,
  ActionRowBuilder,
  EmbedBuilder,
  Interaction,
  Client,
} from "discord.js";

type Inventory = {
  name: string;
  description: string;
  quantity: number;
  buy_price: number;
  sell_price: number;
  item_image: string;
  admin_only: boolean;
};

type InventoryEntry = {
  number: number;
  item: Inventory;
};

const ITEMS_PER_PAGE = 5;

function buildInventory(): InventoryEntry[] {
  const basicItem: Inventory = {
    name: "Basic Item",
    description: "A basic item for testing purposes",
    quantity: 1,
    buy_price: 10,
    sell_price: 5,
    item_image: "https://picsum.photos/200/300",
    admin_only: false,
  };

  const inv: InventoryEntry[] = [];
  for (let i = 1; i <= 21; i++) {
    inv.push({ number: i, item: basicItem });
  }
  return inv;
}

function getPage(inv: InventoryEntry[], page: number) {
  const start = (page - 1) * ITEMS_PER_PAGE;
  return inv.slice(start, start + ITEMS_PER_PAGE);
}

function buildEmbed(
  inv: InventoryEntry[],
  page: number,
  totalPages: number
) {
  const embed = new EmbedBuilder()
    .setTitle(`Inventory Page ${page}/${totalPages}`)
    .setColor("Blurple")
    .setDescription("Your inventory items are listed below:")
    .setFooter({ text: "Freyr Bot Inventory System" });

  getPage(inv, page).forEach((invItem) => {
    embed.addFields({
      name: `${invItem.item.name} x${invItem.item.quantity}`,
      value: `${invItem.item.description}\nBuy Price: ${invItem.item.buy_price} coins | Sell Price: ${invItem.item.sell_price} coins`,
    });
  });

  return embed;
}

function buildRow(page: number, totalPages: number) {
  const backButton = new ButtonBuilder()
    .setCustomId(`inventory_back_${page}`)
    .setLabel("⬅️ Back")
    .setStyle(ButtonStyle.Primary)
    .setDisabled(page <= 1);

  const nextButton = new ButtonBuilder()
    .setCustomId(`inventory_next_${page}`)
    .setLabel("Next ➡️")
    .setStyle(ButtonStyle.Primary)
    .setDisabled(page >= totalPages);

  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    backButton,
    nextButton
  );
}

export default {
  data: new SlashCommandBuilder()
    .setName("inventory")
    .setDescription("testing inventory commands"),

  async execute(interaction: ChatInputCommandInteraction) {
    const inventory = buildInventory();
    const totalPages = Math.ceil(inventory.length / ITEMS_PER_PAGE);
    const page = 1;

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const embed = buildEmbed(inventory, page, totalPages);
    const row = buildRow(page, totalPages);

    await interaction.editReply({
      embeds: [embed],
      components: [row],
    });
  },

  async button_interaction(interaction: Interaction, client: Client) {
    if (!interaction.isButton()) return;

    const inventory = buildInventory();
    const totalPages = Math.ceil(inventory.length / ITEMS_PER_PAGE);

    const [, action, pageStr] = interaction.customId.split("_");
    let page = parseInt(pageStr);

    if (action === "next") page++;
    if (action === "back") page--;

    if (page < 1) page = 1;
    if (page > totalPages) page = totalPages;

    const embed = buildEmbed(inventory, page, totalPages);
    const row = buildRow(page, totalPages);

    await interaction.update({
      embeds: [embed],
      components: [row],
    });
  },
};
