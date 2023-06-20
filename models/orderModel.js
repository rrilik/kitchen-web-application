const mongoose = require('mongoose');
const getOrderStatus = require('../utils/getOrderStatus');

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    fullName: {
      type: String,
      required: [true, 'Поле повного імені не повинно бути пустим'],
    },
    address: {
      type: String,
      required: [true, 'Адреса не вільна'],
    },
    phoneNumber: {
      type: String,
      required: [true, 'Номер телефону не може бути пустим'],
    },
    status: {
      type: String,
      enum: ['PENDING', 'SHIPPING', 'SUCCESS', 'CANCELED'],
      default: 'PENDING',
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    products: {
      type: [
        {
          product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: [true, 'Продукти не можна залишати порожніми'],
            validate: [
              {
                validator: async function (value) {
                  const count = await mongoose.models.Product.countDocuments({
                    _id: value,
                  });

                  return count;
                },
                message: 'Немає продукту з таким ідентифікатором',
              },
            ],
          },
          price: {
            type: Number,
          },
          amount: {
            type: Number,
            required: [true, 'Кількість товару не можна залишати пустим'],
            min: [1, 'Кількість товарів має бути більше 0'],
            validate: {
              validator: async function (v) {
                const product = await mongoose.models.Product.findById(
                  this.product
                );
                return v <= product.inStock;
              },
              message: 'Товару немає в наявності',
            },
          },
        },
      ],
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: 'Список продуктів не може бути пустим',
      },
    },
  },
  {
    id: false,
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true, getters: true },
    toObject: { virtuals: true },
  }
);

orderSchema.index({ fullName: 1, phoneNumber: 1 });
orderSchema.index({ '$**': 'text' });

orderSchema.path('status').get((value) => getOrderStatus(value));

orderSchema.pre('save', async function (next) {
  this.products = await Promise.all(
    this.products.map(async (productObj) => {
      // decrease product inStock
      const productDoc = await mongoose.models.Product.findByIdAndUpdate(
        productObj.product,
        { $inc: { inStock: -productObj.amount } }
      );
      // add current price
      return { ...productObj, price: productDoc.price };
    })
  );

  next();
});

orderSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'products.product',
    select: 'name slug -categories images',
  }).populate({
    path: 'user',
    select: 'fullName email image',
  });

  next();
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
