import type { MarketCenter, PriceEntry, Vegetable } from "./types";

export const MARKETS: MarketCenter[] = [
  {
    id: "dambulla",
    name: "Dambulla Economic Centre",
    nameSi: "Dambulla Arthika Madhyasthanaya",
    district: "Matale",
    emoji: "🏛️",
  },
  {
    id: "kappetipola",
    name: "Kappetipola Market",
    nameSi: "කප්පෙටිපොළ වෙළඳපොළ",
    district: "Kandy",
    emoji: "🌾",
  },
  {
    id: "peliyagoda",
    name: "Peliyagoda Market",
    nameSi: "පෑලියගොඩ වෙළඳපොළ",
    district: "Gampaha",
    emoji: "🚛",
  },
  {
    id: "kandy",
    name: "Kandy Economic Centre",
    nameSi: "මහනුවර ආර්ථික මධ්‍යස්ථානය",
    district: "Kandy",
    emoji: "⛰️",
  },
  {
    id: "nuwara-eliya",
    name: "Nuwara Eliya Market",
    nameSi: "නුවර එළිය වෙළඳපොළ",
    district: "Nuwara Eliya",
    emoji: "🌿",
  },
  {
    id: "pettah",
    name: "Pettah Market",
    nameSi: "පැට්ටහ වෙළඳපොළ",
    district: "Colombo",
    emoji: "🏙️",
  },
];

export const VEGETABLES: Vegetable[] = [
  { id: "beans", name: "Beans", nameSi: "බෝංචි", emoji: "🫘", unit: "kg" },
  { id: "carrot", name: "Carrot", nameSi: "කැරට්", emoji: "🥕", unit: "kg" },
  { id: "tomato", name: "Tomato", nameSi: "තක්කාලි", emoji: "🍅", unit: "kg" },
  { id: "potato", name: "Potato", nameSi: "අල", emoji: "🥔", unit: "kg" },
  { id: "onion", name: "Onion", nameSi: "ලූණු", emoji: "🧅", unit: "kg" },
  { id: "cabbage", name: "Cabbage", nameSi: "ගෝවා", emoji: "🥬", unit: "kg" },
  { id: "brinjal", name: "Brinjal", nameSi: "වම්බටු", emoji: "🍆", unit: "kg" },
  { id: "green-chilli", name: "Green Chilli", nameSi: "මිරිස්", emoji: "🌶️", unit: "kg" },
  { id: "pumpkin", name: "Pumpkin", nameSi: "Wattakka", emoji: "🎃", unit: "kg" },
  { id: "okra", name: "Ladies Finger", nameSi: "බඩඉක්ක", emoji: "🌱", unit: "kg" },
  { id: "beetroot", name: "Beetroot", nameSi: "බීට්", emoji: "🔴", unit: "kg" },
  { id: "leeks", name: "Leeks", nameSi: "ලීක්ස්", emoji: "🧄", unit: "kg" },
];

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

const today = daysAgo(0);
const yesterday = daysAgo(1);
const twoDaysAgo = daysAgo(2);

export const DEMO_PRICES: PriceEntry[] = [
  // Dambulla - today
  { id: "1", marketId: "dambulla", vegetableId: "beans", price: 420, date: today },
  { id: "2", marketId: "dambulla", vegetableId: "carrot", price: 280, date: today },
  { id: "3", marketId: "dambulla", vegetableId: "tomato", price: 350, date: today },
  { id: "4", marketId: "dambulla", vegetableId: "potato", price: 220, date: today },
  { id: "5", marketId: "dambulla", vegetableId: "onion", price: 310, date: today },
  { id: "6", marketId: "dambulla", vegetableId: "cabbage", price: 180, date: today },
  { id: "7", marketId: "dambulla", vegetableId: "brinjal", price: 290, date: today },
  { id: "8", marketId: "dambulla", vegetableId: "green-chilli", price: 680, date: today },
  // Dambulla - yesterday
  { id: "9", marketId: "dambulla", vegetableId: "beans", price: 400, date: yesterday },
  { id: "10", marketId: "dambulla", vegetableId: "carrot", price: 260, date: yesterday },
  { id: "11", marketId: "dambulla", vegetableId: "tomato", price: 380, date: yesterday },
  { id: "12", marketId: "dambulla", vegetableId: "potato", price: 210, date: yesterday },
  { id: "13", marketId: "dambulla", vegetableId: "onion", price: 295, date: yesterday },
  // Kappetipola - today
  { id: "14", marketId: "kappetipola", vegetableId: "beans", price: 390, date: today },
  { id: "15", marketId: "kappetipola", vegetableId: "carrot", price: 250, date: today },
  { id: "16", marketId: "kappetipola", vegetableId: "tomato", price: 320, date: today },
  { id: "17", marketId: "kappetipola", vegetableId: "potato", price: 200, date: today },
  { id: "18", marketId: "kappetipola", vegetableId: "pumpkin", price: 140, date: today },
  { id: "19", marketId: "kappetipola", vegetableId: "okra", price: 320, date: today },
  // Kappetipola - yesterday
  { id: "20", marketId: "kappetipola", vegetableId: "beans", price: 410, date: yesterday },
  { id: "21", marketId: "kappetipola", vegetableId: "carrot", price: 270, date: yesterday },
  // Peliyagoda - today
  { id: "22", marketId: "peliyagoda", vegetableId: "beans", price: 450, date: today },
  { id: "23", marketId: "peliyagoda", vegetableId: "onion", price: 340, date: today },
  { id: "24", marketId: "peliyagoda", vegetableId: "leeks", price: 380, date: today },
  { id: "25", marketId: "peliyagoda", vegetableId: "beetroot", price: 260, date: today },
  // Peliyagoda - 2 days ago
  { id: "26", marketId: "peliyagoda", vegetableId: "beans", price: 430, date: twoDaysAgo },
  { id: "27", marketId: "peliyagoda", vegetableId: "onion", price: 320, date: twoDaysAgo },
  // Kandy - today
  { id: "28", marketId: "kandy", vegetableId: "cabbage", price: 195, date: today },
  { id: "29", marketId: "kandy", vegetableId: "carrot", price: 270, date: today },
  { id: "30", marketId: "kandy", vegetableId: "potato", price: 215, date: today },
  // Nuwara Eliya - today
  { id: "31", marketId: "nuwara-eliya", vegetableId: "carrot", price: 240, date: today },
  { id: "32", marketId: "nuwara-eliya", vegetableId: "leeks", price: 350, date: today },
  { id: "33", marketId: "nuwara-eliya", vegetableId: "beetroot", price: 240, date: today },
  { id: "34", marketId: "nuwara-eliya", vegetableId: "cabbage", price: 170, date: today },
  // Pettah - today
  { id: "35", marketId: "pettah", vegetableId: "tomato", price: 370, date: today },
  { id: "36", marketId: "pettah", vegetableId: "onion", price: 360, date: today },
  { id: "37", marketId: "pettah", vegetableId: "green-chilli", price: 720, date: today },
];
