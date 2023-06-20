const mongoose = require('mongoose');
const slugify = require('slugify');
const AppError = require('../errors/AppError');

// TODO: validate
const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Назва типу продукту не може залишатися пустою'],
      minLength: [3, 'Назва продукту, яка складається щонайменше з 3 символів'],
      maxLength: [20, 'Назва типу товару до 30 символів'],
      trim: true,
      unique: true,
      uniqueCaseInsensitive: true,
    },
    slug: String,
    description: {
      type: String,
      required: [true, 'Опис не може бути пустим'],
      minLength: [30, 'Опис не менше 50 символів'],
      trim: true,
    },
    enable: {
      type: Boolean,
      default: true,
    },
  },
  {
    id: false,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

categorySchema.index({ slug: 1 });
categorySchema.index({ name: 'text' });

categorySchema.path('name').validate(async function (value) {
  if (this.isNew) {
    const nameCount = await mongoose.models.Category.countDocuments({
      name: value,
    });
    return !nameCount;
  }

  return true;
}, 'Ця назва категорії продукту вже існує');

categorySchema.pre(/(u|U)pdate/, async function (next) {
  const { _id } = this.getQuery();
  const updatedName = this.get('name');
  const nameCount = await mongoose.models.Category.countDocuments({
    name: updatedName,
    _id: {
      $ne: _id,
    },
  });

  if (!nameCount) next();
  else throw new AppError('Ця назва категорії продукту вже існує', 400);
});

categorySchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
