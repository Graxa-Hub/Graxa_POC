
export function tratarCPF(cpf){
    if(validarCPF(cpf)){
        return limparCampoNumerico(cpf)
    }else{
        return "CPF Inválido"
    }
}

 export function validarCPF(cpf) {
  if (!cpf) return false;

  cpf = limparCampoNumerico(cpf);
  if (cpf.length !== 11) return false;
  if (/^(\d)\1+$/.test(cpf)) return false;

  const calcularDigito = (cpfSlice) => {
    let soma = 0;
    for (let i = 0; i < cpfSlice.length; i++) {
      soma += parseInt(cpfSlice[i]) * ((cpfSlice.length + 1) - i);
    }
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };

  const digito1 = calcularDigito(cpf.slice(0, 9));
  const digito2 = calcularDigito(cpf.slice(0, 9) + digito1);

  return{cpfValido:digito1 === parseInt(cpf[9]) && digito2 === parseInt(cpf[10]),"cpf":cpf};
}

function limparCampoNumerico(valorParaLimpar) { 
    return valorParaLimpar.replace(/\D/g, ''); 
}

export function validarEmail(email) {
    return /\S+@\S+\.\S+/.test(email); 
}
export function isPreenchido(items = []) {
  return items.every(item => {
    if (item == null) return false;              
    if (typeof item === 'string') return item.trim() !== ''; 
    if (typeof item === 'number') return !isNaN(item);     
    if (Array.isArray(item)) return item.length > 0;       
    if (typeof item === 'object') return Object.keys(item).length > 0;
    return true;
  });
}