const mongoose = require('mongoose');
const slugify = require('slugify');
const AppError = require('../errors/AppError');
const { getImageUrl } = require('../utils/image');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: [true, 'Назва продукту не може бути пустою'],
      minLength: [10, 'Назва продукту має містити не менше 10 символів'],
      maxLength: [100, 'Назва типу продукту має містити до 100 символів'],
      unique: true,
      uniqueCaseInsensitive: true,
    },
    slug: String,
    description: {
      type: String,
      required: [true, 'Опис продукту не може бути пустим'],
      minLength: [70, 'Опис товару має бути не менше 70 символів'],
    },
    images: [String],
    price: {
      type: Number,
      required: [true, 'Ціна не може бути пустою'],
      min: [0, 'Ціна продажу не може бути від’ємним числом'],
    },
    inStock: {
      type: Number,
      default: 0,
    },
    ratingsAverage: {
      type: Number,
      default: 4.0,
      set: (val) => Math.round(val * 10) / 10,
    },
    ratingsQuantity: {
      type: Number,
      defautl: 0,
    },
    categories: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Category',
      required: [true, 'Тип продукту не можна залишити порожнім'],
      validate: {
        validator: async (value) => {
          const result = await Promise.all(
            value.map(async (el) => {
              const count = await mongoose.models.Category.countDocuments({
                _id: el,
              });
              return count;
            })
          );

          return result.some((el) => el !== 0);
        },
        message: 'Категорія продукту з таким ідентифікатором не існує',
      },
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    id: false,
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true, getters: true },
    toObject: { virtuals: true, getters: true },
  }
);

productSchema.index({ slug: 1 });
productSchema.index({ price: 1 });
productSchema.index({ name: 'text' });

productSchema.path('name').validate(async function (value) {
  if (this.isNew) {
    const nameCount = await mongoose.models.Product.countDocuments({
      name: value,
    });
    return !nameCount;
  }

  return true;
}, 'Ця назва продукту вже існує');

productSchema
  .path('images')
  .get((images) => images.map((img) => getImageUrl(img)));

productSchema.pre(/(u|U)pdate/, async function (next) {
  const { _id } = this.getQuery();
  const updatedName = this.get('name');
  const nameCount = await mongoose.models.Product.countDocuments({
    name: updatedName,
    _id: {
      $ne: _id,
    },
  });

  if (!nameCount) next();
  else throw new AppError('Ця назва продукту вже існує', 400);
});

productSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

productSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'categories',
    select: 'name slug description',
  });

  next();
});

productSchema.methods.didUserBuy = async function (productId, userId) {
  const purchasedProduct = await mongoose.models.Order.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $unwind: {
        path: '$products',
      },
    },
    { $group: { _id: null, product: { $addToSet: '$products.product' } } },
    { $unwind: '$product' },
    {
      $match: {
        product: new mongoose.Types.ObjectId(productId),
      },
    },
  ]);

  return purchasedProduct.length !== 0;
};

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
