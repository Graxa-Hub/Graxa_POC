
    let usuarios = [];
    

    async function getLivros() {
      const resquest = await fetch(baseURL);
      return await resquest.json();
    }
    async function getLivroById(id) {
      const resquest = await fetch(`${baseURL}/${id}`);
      return await resquest.json();
    }

    function realizarRequisicao(id) {
      if (id == null) {
        botaoRequisicao.innerHTML = `<button onclick="cadastrar()">Cadastrar</button>`
      } else {
        botaoRequisicao.innerHTML = `<button onclick="alterar('${id}')">Alterar</button>`

      }

    }

    async function mostrar() {

      try {
        const data = await getLivros()
        data.forEach(element => tabelaLivros.innerHTML += `<tr>
                <td>${element.titulo}</td>
                <td> ${element.autor}</td>
                <td>${element.ano}</td>
                <td>${element.pagina}</td>
                <td>${element.preco.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL"
        })}
                </td>
                <td>${element.quantidade}</td>
                <td>
                    <a type="submit" onclick="modalFormulario('${element.id}')" ><i
                        class="fas fa-edit fa-lg"></i>
                    </a>
                </td>
                <td>
                  <a onclick="modalRemover('${element.id}')">
                    <i class="fas fa-trash-alt fa-lg"></i>
                  </a>
                </td>
              </tr>`);
      }
      catch {
        console.log("DEU RUIM")
      }
    }

    async function modalRemover(id) {
      div_modalRemover.style.display = "block"
      botaoRemover.innerHTML = `<a onclick="fecharModal()" id="nao">Não</a><a onclick="remover('${id}'), fecharModal()" id="sim">Sim</a>`
    }

    async function modalFormulario(id) {

      if (id == null) {
        modal.style.display = "block"
        realizarRequisicao()
        input_titulo.value = ""
        input_autor.value = ""
        input_ano.value = ""
        input_pagina.value = ""
        input_preco.value = ""
        input_quantidade.value = ""
      } else {
        modal.style.display = "block"
        realizarRequisicao(id)
        const data = await getLivroById(id)
        console.log(data)
        input_titulo.value = data.titulo
        input_autor.value = data.autor
        input_ano.value = data.ano
        input_pagina.value = data.pagina
        input_preco.value = data.preco
        input_quantidade.value = data.quantidade
      }
    }

    function fecharModal() {
        modal.style.display = "none"
        div_modalRemover.style.display = "none"
    }

    function cadastrar() {
      const titulo = input_titulo.value;
      const autor = input_autor.value;
      const ano = input_ano.value;
      const pagina = input_pagina.value;
      const preco = input_preco.value;
      const quantidade = input_quantidade.value;


      if (!verificarCampos([titulo, autor, ano, pagina, preco, quantidade])) {
        console.log("Preencha todos os campos!");
        return;
      }


      const novoLivro = {
        titulo,
        autor,
        ano,
        pagina,
        preco,
        quantidade
      };

      fetch(baseURL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(novoLivro)
      })
        .then(res => res.json())
        .then(() => {
          tabelaLivros.innerHTML = "";
          mostrar();
          fecharModal();
        })
        .catch(err => console.error(err));
    }


    function alterar(id) {
      const titulo = input_titulo.value;
      const autor = input_autor.value;
      const ano = input_ano.value;
      const pagina = input_pagina.value;
      const preco = input_preco.value;
      const quantidade = input_quantidade.value;


      if (!verificarCampos([titulo, autor, ano, pagina, preco, quantidade])) {
        return;
      }


      const livroAtualizado = {
        titulo,
        autor,
        ano,
        pagina,
        preco,
        quantidade
      };


      fetch(`${baseURL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(livroAtualizado)
      })
        .then(() => {
          tabelaLivros.innerHTML = "";
          mostrar();
          fecharModal();
        })
        .catch(err => console.error(err));
    }


    function verificarCampos(campos = []) {
      return campos.every((item) =>
        item != null
      )
    }

 function remover(id) {
  fetch(`${baseURL}/${id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" }
  })
  .then(() => {
    console.log("Livro removido com sucesso!");
    tabelaLivros.innerHTML = "";
    mostrar();                  
  })
  .catch(err => console.error("Erro ao remover:", err));
}



    mostrar()
