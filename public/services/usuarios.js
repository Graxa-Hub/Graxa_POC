const baseURL = 'http://localhost:3000/usuarios';


export async function getUsuarios(tipoUsuario) {
    try {
        const endpoint = tipoUsuario ? `${baseURL}${tipoUsuario}` : `${baseURL}`;
        const response = await fetch(endpoint);

        if (!response.ok) {
            return {
                sucesso: false,
                usuario: null,
                mensagem: `Erro HTTP: ${response.status}`
            };
        }
        const usuario = await response.json();
        const { senha, ...usuarioSemSenha } = usuario;
        return {
            sucesso: true,
            usuario: usuarioSemSenha,
            mensagem: 'Usuário encontrado com sucesso'
        };

    } catch (error) {
        console.error('Erro ao buscar usuário:', error);
        return {
            sucesso: false,
            usuario: null,
            mensagem: 'Erro ao buscar usuário'
        };
    }
}


export async function getUsuariosById(id) {
    try {

        const response = await fetch(`${baseURL}/${id}`);

        if (!response.ok) {
            return {
                sucesso: false,
                usuario: null,
                mensagem: `Erro HTTP: ${response.status}`
            };
        }
        const usuario = await response.json();
        return {
            sucesso: true,
            usuario: usuario,
            mensagem: 'Usuário encontrado com sucesso'
        };

    } catch (error) {
        console.error('Erro ao buscar usuário:', error);
        return {
            sucesso: false,
            usuario: null,
            mensagem: 'Erro ao buscar usuário'
        };
    }
}



export async function cadastrarUsuario(nome, email, telefone, cpf, senha, tipoUsuario) {

    const usuario = {
        nome,
        email,
        telefone,
        cpf,
        senha,
        tipoUsuario,
        statusUsuario: true
    }

    try {
        const response = await fetch(baseURL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(usuario)
        })

        if (!response.ok) {
            return {
                sucesso: false,
                mensagem: `Erro HTTP: ${response.status}`
            };
        }

        return {
            sucesso: true,
            mensagem: 'Usuário cadastrado com sucesso'
        };

    } catch (error) {
        return {
            sucesso: false,
            mensagem: 'Erro ao cadastrar usuário'
        };
    }
}

export async function atualizarUsuario(id, nome, email, telefone, cpf, tipoUsuario) {

    try {
        const usuarioExistente = await getUsuariosById(id)

        if (usuarioExistente.sucesso) {
            console.log('Usuário enviado para atualização:', usuarioExistente);


            const usuario = {
                nome,
                email,
                telefone,
                cpf,
                senha: usuarioExistente.usuario.senha,
                tipoUsuario,
                statusUsuario: true
            }
            const response = await fetch(`${baseURL}/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(usuario)
            })
            if (!response.ok) {
                return {
                    sucesso: false,
                    usuario: null,
                    mensagem: `Erro HTTP: ${response.status}`
                };
            }

            const usuarioAtualizado = await response.json();


            const { senha, ...usuarioSemSenha } = usuarioAtualizado;
            return {
                sucesso: true,
                usuario: usuarioSemSenha,
                mensagem: 'Usuário atualizado com sucesso'
            };
        }else{
            return {
                sucesso: false,
                usuario: null,
                mensagem: 'Usuário não existe'
            };
        }
    } catch (error) {
        return {
            sucesso: false,
            usuario: null,
            mensagem: 'Erro ao atualizar usuário'
        };
    }

}

export async function checkCredentials(email, senha) {
    try {

        const response = await fetch(baseURL);

        if (!response.ok) {
            return {
                sucesso: false,
                usuario: null,
                mensagem: `Erro HTTP: ${response.status}`
            };
        }

        const usuarios = await response.json();

        const usuarioEncontrado = usuarios.find(usuario =>
            usuario.email === email && usuario.senha === senha && usuario.statusUsuario == true
        );



        if (usuarioEncontrado) {

            const { senha, ...usuarioSemSenha } = usuarioEncontrado;
            return {
                sucesso: true,
                usuario: usuarioSemSenha,
                mensagem: 'Login realizado com sucesso'
            };
        } else {
            return {
                sucesso: false,
                usuario: null,
                mensagem: 'Email ou senha incorretos'
            };
        }

    } catch (error) {
        return {
            sucesso: false,
            usuario: null,
            mensagem: 'Erro no servidor'
        };
    }
}

export async function safeDeleteUsuario(id) {


    try {
        const usuario = await getUsuariosById(id)
        if (usuario.sucesso) {

            const response = await fetch(`${baseURL}/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ statusUsuario: false })

            })

            if (!response.ok) {
                return {
                    sucesso: false,
                    mensagem: `Erro HTTP: ${response.status}`
                };
            }

            return {
                    sucesso: true,
                    mensagem: `Usuario desativado com sucesso!`
                };


        } else {
            return {
                sucesso: false,
                mensagem: 'Usuario não encontrado'
            };
        }
    } catch (error) {
        return {
            sucesso: false,
            mensagem: 'Erro no servidor'
        };
    }
}