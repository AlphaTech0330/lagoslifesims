const mongoose = require('mongoose');
require('dotenv').config();

const Item = require('./models/Item');
const Property = require('./models/Property');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/southwest_hustle';

const COMMODITIES = [
  {
    name: 'Kwara Yam Tubers',
    category: 'Raw Food',
    basePrice: 1500,
    regionalMultipliers: {
      Lagos: 2.4,   // ₦3,600
      Ibadan: 1.6,  // ₦2,400
      Ogun: 1.3,    // ₦1,950
      Osun: 1.1,    // ₦1,650
      Kwara: 0.8    // ₦1,200 (Cheap origin)
    }
  },
  {
    name: 'Osogbo Adire Textile',
    category: 'Luxury/Art',
    basePrice: 12000,
    regionalMultipliers: {
      Lagos: 1.8,   // ₦21,600
      Ibadan: 1.2,  // ₦14,400
      Ogun: 1.0,    // ₦12,000
      Osun: 0.8,    // ₦9,600 (Cheap origin)
      Kwara: 1.1    // ₦13,200
    }
  },
  {
    name: 'Agbara Manufactured Plastics',
    category: 'Manufactured',
    basePrice: 5000,
    regionalMultipliers: {
      Lagos: 1.6,   // ₦8,000
      Ibadan: 1.1,  // ₦5,500
      Ogun: 0.9,    // ₦4,500 (Cheap origin)
      Osun: 1.2,    // ₦6,000
      Kwara: 1.4    // ₦7,000
    }
  },
  {
    name: 'Ibadan Farm Eggs (Crate)',
    category: 'Raw Food',
    basePrice: 3200,
    regionalMultipliers: {
      Lagos: 1.5,   // ₦4,800
      Ibadan: 0.9,  // ₦2,880 (Cheap origin)
      Ogun: 1.1,    // ₦3,520
      Osun: 1.0,    // ₦3,200
      Kwara: 1.2    // ₦3,840
    }
  },
  {
    name: 'Lagos Tech Hardware Parts',
    category: 'Tech',
    basePrice: 85000,
    regionalMultipliers: {
      Lagos: 1.0,   // ₦85,000 (Origin)
      Ibadan: 1.3,  // ₦110,500
      Ogun: 1.2,    // ₦102,000
      Osun: 1.5,    // ₦127,500
      Kwara: 1.6    // ₦136,000
    }
  }
];

const PROPERTIES = [
  // Lagos Real Estate
  {
    title: 'Balogun Wholesale Depot',
    state: 'Lagos',
    district: 'Balogun, Lagos Island',
    type: 'Warehouse',
    purchasePrice: 45000000,
    rentPricePerMonth: 1200000,
    storageCapacityBonus: 10000,
    passiveIncomePerDay: 50000
  },
  {
    title: 'Computer Village Tech Hub',
    state: 'Lagos',
    district: 'Ikeja',
    type: 'Retail Shop',
    purchasePrice: 25000000,
    rentPricePerMonth: 800000,
    storageCapacityBonus: 2000,
    passiveIncomePerDay: 35000
  },

  // Ibadan Real Estate
  {
    title: 'Bodija Grain Silo & Depot',
    state: 'Ibadan',
    district: 'Bodija Market',
    type: 'Warehouse',
    purchasePrice: 18000000,
    rentPricePerMonth: 450000,
    storageCapacityBonus: 8000,
    passiveIncomePerDay: 20000
  },
  {
    title: 'Dugbe Commercial Suite',
    state: 'Ibadan',
    district: 'Dugbe Commercial Zone',
    type: 'Retail Shop',
    purchasePrice: 12000000,
    rentPricePerMonth: 300000,
    storageCapacityBonus: 1500,
    passiveIncomePerDay: 15000
  },

  // Ogun Real Estate
  {
    title: 'Agbara Freight Vault',
    state: 'Ogun',
    district: 'Agbara Industrial Estate',
    type: 'Industrial Depot',
    purchasePrice: 28000000,
    rentPricePerMonth: 700000,
    storageCapacityBonus: 15000,
    passiveIncomePerDay: 30000
  },

  // Osun Real Estate
  {
    title: 'Osogbo Artisan Atelier',
    state: 'Osun',
    district: 'Osogbo Central',
    type: 'Retail Shop',
    purchasePrice: 8500000,
    rentPricePerMonth: 180000,
    storageCapacityBonus: 2000,
    passiveIncomePerDay: 10000
  },

  // Kwara Real Estate
  {
    title: 'Ilorin Transit & Storage Hub',
    state: 'Kwara',
    district: 'Ilorin Central',
    type: 'Warehouse',
    purchasePrice: 12000000,
    rentPricePerMonth: 300000,
    storageCapacityBonus: 6000,
    passiveIncomePerDay: 12000
  }
];

const seedDatabase = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing collections
    await Item.deleteMany({});
    await Property.deleteMany({});
    console.log('Cleared existing Items and Properties.');

    // Seed Items and Properties
    const insertedItems = await Item.insertMany(COMMODITIES);
    console.log(`Successfully seeded ${insertedItems.length} commodities.`);

    const insertedProperties = await Property.insertMany(PROPERTIES);
    console.log(`Successfully seeded ${insertedProperties.length} real estate properties.`);

    console.log('Database seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error.message);
    process.exit(1);
  }
};

seedDatabase();