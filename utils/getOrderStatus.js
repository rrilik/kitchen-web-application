module.exports = (status) => {
  switch (status) {
    case 'PENDING':
      return 'Обробка';
    case 'SHIPPING':
      return 'Виконується доставка';
    case 'SUCCESS':
      return 'успіх';
    case 'CANCELED':
      return 'Скасовано';
    default:
      return 'Невідомий';
  }
};
