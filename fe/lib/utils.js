import moment from 'moment';

export const formatRupiah = (value) => {
  if (value === null || value === undefined) return 'Rp 0';
  return `Rp ${Number(value).toLocaleString('id-ID')}`;
};

export const formatDate = (dateString) => {
  return dateString ? moment(dateString).format('DD/MM/YYYY') : '-';
};

export const parseNumber = (value) => {
  if (!value) return 0;
  return String(value).replace(/\$\s?|(,*)/g, '');
};