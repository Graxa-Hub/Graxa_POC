import { isPreenchido, validarEmail, validarCPF } from '../utils/validationUtils.js';
import { limparTelefone, formatarCPF, formatarTelefone } from '../utils/stringUtils.js';
import { checkCredentials, cadastrarUsuario, getUsuariosById, atualizarUsuario, safeDeleteUsuario } from '../services/usuarios.js'
import { buscarAeroportoMaisProximo } from '../services/aeroportoService.js';

const result = await buscarAeroportoMaisProximo(lat, lon);
console.log(result.aeroporto, result.distancia_km);

if (document.getElementById('botao-login')) {
    document.getElementById('botao-login').addEventListener('click', checarCredenciais);
}
async function checarCredenciais() {


    const email = document.getElementById("input_email").value;
    const password = document.getElementById("input_password").value;

    if (isPreenchido([email, password])) {
        if (!validarEmail(email)) {
            mostrarMensagem('E-mail inválido.', 'erro');
            return;
        }

        try {
            const response = await checkCredentials(email, password);

            if (response.sucesso) {

                sessionStorage.setItem('id', response.usuario.id);



                window.location.href = '/';

            } else {
                mostrarMensagem(response.mensagem, 'erro');
            }

        } catch (error) {

            mostrarMensagem('Erro de conexão. Tente novamente.', 'erro');
        }
    } else {
        mostrarMensagem('Por favor, preencha email e senha.', 'aviso');
    }
}
if (document.getElementById('botao-cadastro')) {
    document.getElementById('botao-cadastro').addEventListener('click', cadastrar);
}

async function cadastrar() {
    const nome = document.getElementById("name").value;
    let cpf = document.getElementById("cpf").value;
    const email = document.getElementById("signupEmail").value;
    const telefone = limparTelefone(document.getElementById("signupTelefone").value);
    const senha = document.getElementById("signupPassword").value;
    const confirmSenha = document.getElementById("confirmPassword").value;
    const tipoUsuario = document.getElementById("userType").value;

    console.log(telefone)

    if (isPreenchido([nome, email, telefone, cpf, senha, tipoUsuario])) {
        const cpfTratado = validarCPF(cpf)
        if (cpfTratado.cpfValido) {
            cpf = cpfTratado.cpf;
        } else {
            mostrarMensagem('CPF inválido.', 'erro');
            return;
        }

        if (!validarEmail(email)) {
            mostrarMensagem('E-mail inválido.', 'erro');
            return;
        }

        if (senha !== confirmSenha) {
            mostrarMensagem('As senhas não coincidem.', 'erro');
            return;
        }

        try {
            const response = await cadastrarUsuario(nome, email, telefone, cpf, senha, tipoUsuario);

            if (response.sucesso) {
                window.location.href = '/login';

            } else {
                mostrarMensagem(response.mensagem, 'erro');
            }

        } catch (error) {

            mostrarMensagem('Erro de conexão. Tente novamente.', 'erro');
        }
    } else {
        mostrarMensagem('Preencha todos os campos.', 'aviso');
    }

}

export async function getIdUsuarios() {
    try {
        const id = sessionStorage.getItem('id')
        const response = await getUsuariosById(id)

        if (response.sucesso) {
            const usuario = response.usuario
            document.getElementById("headerName").innerText = `${usuario.nome}`
            document.getElementById("nomeUsuarioTitle").innerText = `${usuario.nome}`
            document.getElementById("input_nome").value = usuario.nome
            document.getElementById("input_email").value = usuario.email
            document.getElementById("input_cpf").value = formatarCPF(usuario.cpf)
            document.getElementById("input_telefone").value = formatarTelefone(usuario.telefone)
            document.getElementById("input_tipoUsuario").value = usuario.tipoUsuario
            return
        }
        mostrarMensagem(response.mensagem, 'erro');
    } catch (error) {
        mostrarMensagem('Erro de conexão. Tente novamente.', 'erro');
    }

}


if (document.getElementById('btn-atualizar')) {
    document.getElementById('btn-atualizar').addEventListener('click', atualizar);
}

async function atualizar() {
    const nome = document.getElementById("input_nome").value;
    let cpf = document.getElementById("input_cpf").value;
    const email = document.getElementById("input_email").value;
    const telefone = limparTelefone(document.getElementById("input_telefone").value);
    const tipoUsuario = document.getElementById("input_tipoUsuario").value;
    const id = sessionStorage.getItem('id')

    if (isPreenchido([nome, email, telefone, cpf, tipoUsuario])) {
        const cpfTratado = validarCPF(cpf)
        if (cpfTratado.cpfValido) {
            cpf = cpfTratado.cpf;
        } else {
            mostrarMensagem('CPF inválido.', 'erro');
            return;
        }

        if (!validarEmail(email)) {
            mostrarMensagem('E-mail inválido.', 'erro');
            return;
        }


        try {
            const response = await atualizarUsuario(id, nome, email, telefone, cpf, tipoUsuario);

            if (response.sucesso) {
                mostrarMensagem(response.mensagem, 'sucesso');
                const inputs = document.querySelectorAll("#form-container-usuario input")
                if (inputs[0].disabled == false) {
                    inputs.forEach(input => {
                        input.disabled = true;
                    });
                    document.getElementById("btn-atualizar").style.display = "none"
                    return
                }

            } else {
                mostrarMensagem(response.mensagem, 'erro');
            }

        } catch (error) {

            mostrarMensagem('Erro de conexão. Tente novamente.', 'erro');
        }
    } else {
        mostrarMensagem('Preencha todos os campos.', 'aviso');
    }
}

if (document.getElementById('confirmar-desativar')) {
    document.getElementById('confirmar-desativar').addEventListener('click', desativar);
}

async function desativar(){
    const id = sessionStorage.getItem('id')
    try{

        const response = await safeDeleteUsuario(id)
        
        if(response.sucesso){
            window.location.href = '/login';
            sessionStorage.clear()
            mostrarMensagem('Conta desativada.', 'aviso');
        } else {
                mostrarMensagem(response.mensagem, 'erro');
            }

        } catch (error) {

            mostrarMensagem(error, 'erro');
        }
}


function mostrarMensagem(mensagem, tipo) {

    let messageContainer = document.getElementById('message-container');
    if (!messageContainer) {
        messageContainer = document.createElement('div');
        messageContainer.id = 'message-container';
        document.body.appendChild(messageContainer);
    }


    const classe = tipo === 'erro' ? 'message-error' :
        tipo === 'sucesso' ? 'message-success' : 'message-warning';

    messageContainer.innerHTML = `<div class="${classe}">${mensagem}</div>`;


    setTimeout(() => {
        messageContainer.innerHTML = '';
    }, 3000);
}
