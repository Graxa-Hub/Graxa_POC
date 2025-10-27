function gerarCodigo6Digitos() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function verificarCodigo(codigoGerado, codigoUsuario) {
  return codigoGerado === codigoUsuario;
}

