// Apresenta timestamps da API no formato local usado em Moçambique.
// Formata datas da API no locale moçambicano; sem valor, devolve texto vazio.
export const dateLabel = (value) => value ? new Intl.DateTimeFormat('pt-MZ', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '';
