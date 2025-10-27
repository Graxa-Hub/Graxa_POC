export function capitalizar(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/(?:^|\s)\S/g, function (char) {
      return char.toUpperCase();
    });
}



function paraMaiusculas(str) {
  return str.toUpperCase();
}

function paraMinusculas(str) {
  return str.toLowerCase();
}

export function formatarTelefone(numero) {
  if (!numero) return '';

  const n = numero.replace(/\D/g, '');

  if (n.length < 8 || n.length > 11) return '';

  let ddd = '';
  let primeiraParteNumero = '';
  let segundaParteNumero = '';

  if (n.length === 8) {          
    primeiraParteNumero = n.slice(0, 4);
    segundaParteNumero = n.slice(4);
  } else if (n.length === 9) {   
    primeiraParteNumero = n.slice(0, 5);
    segundaParteNumero = n.slice(5);
  } else if (n.length === 10) {  
    ddd = n.slice(0, 2);
    primeiraParteNumero = n.slice(2, 6);
    segundaParteNumero = n.slice(6);
  } else if (n.length === 11) {  
    ddd = n.slice(0, 2);
    primeiraParteNumero = n.slice(2, 7);
    segundaParteNumero = n.slice(7);
  }

  return ddd ? `(${ddd}) ${primeiraParteNumero}-${segundaParteNumero}` : `${primeiraParteNumero}-${segundaParteNumero}`;
}

export function limparTelefone(telefone) {
  if (!telefone) return '';
  return telefone.replace(/\D/g, '');
}


export function formatarCPF(cpf) {
  if (!cpf) return '';
  const n = cpf.replace(/\D/g, '');
  if (n.length !== 11) return '';

  return n.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

