const API_URL = "http://localhost:3000/socialifpi/postagem/";
const listaPostagens = document.getElementById("lista-postagens") as HTMLDivElement;
const form = document.getElementById("form-postagem") as HTMLFormElement;
const inputTitulo = document.getElementById("titulo") as HTMLInputElement;
const inputConteudo = document.getElementById("conteudo") as HTMLTextAreaElement;
const inputData = document.getElementById("data") as HTMLInputElement;

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const novaPostagem = {
    titulo: inputTitulo.value,
    conteudo: inputConteudo.value,
    data: inputData.value ? new Date(inputData.value).toISOString() : new Date().toISOString(),
    autor: "Sara",
  };

  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(novaPostagem),
  });

  if (!response.ok) {
    const text = await response.text();
    alert('Erro ao criar postagem: ' + text);
    return;
  }

  form.reset();
  listarPostagens();
});

async function listarPostagens(): Promise<void> {
  listaPostagens.innerHTML = "";

  const response = await fetch(API_URL);

  if (!response.ok) {
    const texto = await response.text();
    console.error('Erro no backend:', texto);
    listaPostagens.innerHTML = "<p>Erro ao carregar postagens.</p>";
    return;
  }

  const postagens: any[] = await response.json();

  postagens.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

  for (const post of postagens) {
    const artigo = document.createElement("article");
    artigo.classList.add("postagem");

    const data = new Date(post.data);
    const dataFormatada = data.toLocaleDateString("pt-BR");

    const comentariosResponse = await fetch(`${API_URL}${post.id}/comentario`);
    let quantidadeComentarios = 0;
    if (comentariosResponse.ok) {
      const comentarios = await comentariosResponse.json();
      quantidadeComentarios = comentarios.length;
    }

    artigo.innerHTML = `
      <h3>${post.titulo}</h3>
      <p>${post.conteudo}</p>
      <p><small>Publicado em: ${dataFormatada}</small></p>
      <p id="contador-${post.id}">💬 ${quantidadeComentarios} comentário(s)</p>
      <button class="botao-curtir" data-id="${post.id}">Curtir (${post.curtidas})</button>
      <button class="botao-ver-comentarios" data-id="${post.id}">Ver Comentários</button>
      <button class="botao-deletar" data-id="${post.id}">Excluir</button>
      <div class="comentarios" id="comentarios-${post.id}" style="display: none; margin-top: 10px;"></div>
    `;

    listaPostagens.appendChild(artigo);
  }

  document.querySelectorAll(".botao-curtir").forEach((btn) =>
    btn.addEventListener("click", async (e) => {
      const id = (e.target as HTMLElement).getAttribute("data-id");
      if (!id) return;
      await fetch(`${API_URL}${id}/curtir`, { method: "POST" });
      listarPostagens();
    })
  );

  document.querySelectorAll(".botao-ver-comentarios").forEach((btn) =>
    btn.addEventListener("click", async (e) => {
      const id = (e.target as HTMLElement).getAttribute("data-id");
      if (!id) return;
      const div = document.getElementById(`comentarios-${id}`);
      if (!div) return;

      if (div.style.display === "none") {
        await carregarComentarios(id);
        div.style.display = "block";
      } else {
        div.style.display = "none";
      }
    })
  );

  document.querySelectorAll(".botao-deletar").forEach((btn) =>
    btn.addEventListener("click", async (e) => {
      const id = (e.target as HTMLElement).getAttribute("data-id");
      if (!id) return;
      if (confirm("Tem certeza que deseja excluir esta postagem?")) {
        await fetch(`${API_URL}${id}`, { method: "DELETE" });
        listarPostagens();
      }
    })
  );
}

async function carregarComentarios(postagemId: string) {
  const div = document.getElementById(`comentarios-${postagemId}`);
  if (!div) return;

  const response = await fetch(`${API_URL}${postagemId}/comentario`);
  if (!response.ok) {
    div.innerHTML = "<p>Erro ao carregar comentários.</p>";
    return;
  }

  const comentarios: any[] = await response.json();
  div.innerHTML = "";

  comentarios.forEach((comentario) => {
    const data = new Date(comentario.data);
    const dataFormatada = data.toLocaleDateString("pt-BR");
    const autor = comentario.autor || "Anônimo";
    const p = document.createElement("p");
    p.innerHTML = `<strong>${autor}</strong> (${dataFormatada}): ${comentario.texto}`;
    div.appendChild(p);
  });
}

listarPostagens();
