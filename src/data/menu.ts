export const menu = [
  {
    id: "bev",
    title: "Beverages",
    subCategories: [
      {
        id: "coffee",
        title: "Coffee",
        options: ["Regular", "Decaf"],
      },
      {
        id: "tea",
        title: "Tea",
        options: ["Regular", "Decaf"],
      },
      {
        id: "soft_drinks",
        title: "Soft Drinks",
        options: [],
      },
    ],
  },
  {
    id: "meals",
    title: "Meals",
    subCategories: [
      {
        id: "sandwich",
        title: "Sandwiches",
        breadOptions: ["White", "Wheat", "Whole-grain"],
      },
      {
        id: "wraps",
        title: "Wraps",
        breadOptions: ["White", "Wheat", "Whole-grain"],
      },
      {
        id: "burgers",
        title: "Burgers",
        breadOptions: ["White", "Wheat", "Whole-grain"],
      },
    ],
  },
  {
    id: "dessert",
    title: "Desserts & Pastries",
    subCategories: [
      { id: "cakes", title: "Cake Slices" },
      { id: "donuts", title: "Donuts" },
    ],
  },
  {
    id: "diet",
    title: "Diet / Banting",
    subCategories: [{ id: "banting", title: "Low Carb / Banting" }],
  },
  {
    id: "extras",
    title: "Extras",
    subCategories: [
      { id: "chips", title: "Fried Chips" },
      { id: "sauces", title: "Extra Sauce / Drizzle" },
      { id: "nuggets", title: "Chicken Nuggets" },
    ],
  },
];
