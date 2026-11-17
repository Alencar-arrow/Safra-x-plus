/* =====================================================================
   COMO LER ESTE ARQUIVO

   Este JavaScript é carregado em TODAS as páginas do site
   (<script src="../js/script.js" defer></script>), mas cada página
   usa só uma parte dele. Por isso o arquivo está dividido em 4 funções,
   uma para cada recurso:

     1. iniciarMenu()       -> menu hambúrguer (todas as páginas)
     2. iniciarArvore()     -> animação da árvore (página Impacto)
     3. iniciarFormulario() -> formulário de contato (página Contato)
     4. iniciarGaleria()    -> filtros e janela de imagem (página Galeria)

   No final do arquivo, as 4 funções são chamadas.

   -------------------------------------------------------------
   A IDEIA MAIS IMPORTANTE: A "GUARDA"
   -------------------------------------------------------------
   Cada função começa procurando um elemento da página:

       const secao = document.querySelector('.arvore-crescimento-secao');
       if (!secao) return;

   Se o elemento NÃO existe (porque estamos em outra página), o "return"
   encerra a função na hora, e nada acontece. Assim o mesmo arquivo
   funciona em todas as páginas sem dar erro.

   -------------------------------------------------------------
   PEQUENO DICIONÁRIO DO QUE VOCÊ VAI VER
   -------------------------------------------------------------
   document.getElementById('x')   -> acha o elemento com id="x"
   document.querySelector('.x')   -> acha o 1º elemento com class="x"
   querySelectorAll('.x')         -> acha TODOS (devolve uma lista)
   elemento.addEventListener('click', funcao)
                                  -> "quando clicarem, execute a função"
   elemento.classList.add/remove/toggle('x')
                                  -> adiciona / tira / alterna a classe "x"
   elemento.setAttribute('a', 'b')-> muda o atributo a para "b"
   elemento.textContent = '...'   -> troca o texto do elemento
   elemento.hidden = true         -> esconde o elemento
   elemento.style.transform = ... -> muda o CSS direto pelo JavaScript
   const x = () => { ... }        -> função "de seta" (mesma coisa que function)
   ===================================================================== */


/* =====================================================================
   1. MENU HAMBÚRGUER
   Abre e fecha o menu no celular. O CSS (header) desenha o botão;
   o JavaScript só troca a classe "ativo" e os atributos de acessibilidade.
   ===================================================================== */

function iniciarMenu() {
    const botaoMenu = document.getElementById('hamburger');
    const menu = document.getElementById('nav-menu');

    // Guarda: se a página não tem menu, não faz nada
    if (!botaoMenu || !menu) return;

    // Fecha o menu: tira a classe "ativo" e avisa os leitores de tela
    function fecharMenu() {
        menu.classList.remove('ativo');
        botaoMenu.setAttribute('aria-expanded', 'false');   // "o menu está fechado"
        botaoMenu.setAttribute('aria-label', 'Abrir menu'); // texto lido pelo leitor de tela
    }

    // Clique no botão: alterna entre aberto e fechado
    botaoMenu.addEventListener('click', () => {
        // O atributo guarda texto ("true"/"false"), então comparamos com 'true'
        const estaAberto = botaoMenu.getAttribute('aria-expanded') === 'true';
        const vaiAbrir = !estaAberto;   // "!" inverte: aberto vira fechado e vice-versa

        botaoMenu.setAttribute('aria-expanded', String(vaiAbrir));
        botaoMenu.setAttribute('aria-label', vaiAbrir ? 'Fechar menu' : 'Abrir menu');

        // toggle('ativo', true) adiciona a classe; toggle('ativo', false) remove
        menu.classList.toggle('ativo', vaiAbrir);
    });

    // Clique em qualquer link do menu: fecha o menu.
    // Usamos um único "ouvinte" no menu inteiro (em vez de um em cada link).
    // closest('a') pergunta: "o que foi clicado está dentro de um <a>?"
    menu.addEventListener('click', (evento) => {
        if (evento.target.closest('a')) {
            fecharMenu();
        }
    });

    // Tecla Esc com o menu aberto: fecha e devolve o foco ao botão
    document.addEventListener('keydown', (evento) => {
        const estaAberto = botaoMenu.getAttribute('aria-expanded') === 'true';

        if (evento.key === 'Escape' && estaAberto) {
            fecharMenu();
            botaoMenu.focus();   // quem usa teclado não "perde" onde estava
        }
    });
}


/* =====================================================================
   2. ANIMAÇÃO DA ÁRVORE (página Impacto)

   COMO FUNCIONA:
   O CSS deixa a seção muito alta e a cena "grudada" na tela (sticky).
   Enquanto você rola a página, este JavaScript:
     a) calcula QUANTO você já rolou da seção (um número de 0 a 1);
     b) usa esse número para mudar o tamanho da semente, do tronco,
        da copa e da floresta, além da barra de progresso e do texto.

     progresso = 0    -> você acabou de chegar na seção (só a semente)
     progresso = 0.5  -> no meio
     progresso = 1    -> chegou ao fim (floresta completa)
   ===================================================================== */

function iniciarArvore() {
    const secao = document.querySelector('.arvore-crescimento-secao');
    if (!secao) return;

    // Esta classe ativa, no CSS, o "scale(0)" das peças (elas começam invisíveis).
    // Está aqui, e não no HTML, de propósito: se o JavaScript falhar,
    // a árvore continua visível e completa.
    secao.classList.add('animada');

    // Peças que vamos usar várias vezes
    const svg = secao.querySelector('.arvore-crescimento');
    const frases = Array.from(secao.querySelectorAll('.arvore-crescimento-etapas p'));
    const barraProgresso = secao.querySelector('.arvore-crescimento-progresso');
    const contador = secao.querySelector('.arvore-crescimento-etapa-contador');

    // Pessoa que pediu "reduzir movimento" no aparelho? (true ou false)
    const reduzirMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Controle para não atualizar a tela mais de uma vez por quadro (veja mais abaixo)
    let atualizacaoAgendada = false;

    // ---------- Funções auxiliares (matemática) ----------

    // Mantém um número dentro de um intervalo.
    // Exemplo: limitar(1.7, 0, 1) -> 1   |   limitar(-3, 0, 1) -> 0
    function limitar(valor, minimo, maximo) {
        return Math.max(minimo, Math.min(maximo, valor));
    }

    // Transforma o progresso GERAL (0 a 1) em um progresso de UMA ETAPA.
    //
    // Exemplo: suavizar(progresso, 0.38, 0.72) quer dizer
    //   "esta etapa começa quando o progresso geral for 0.38
    //    e termina quando for 0.72".
    //   - antes de 0.38 devolve 0
    //   - depois de 0.72 devolve 1
    //   - no meio devolve um valor entre 0 e 1, SUAVIZADO
    //
    // A fórmula "v * v * (3 - 2 * v)" cria uma curva que começa e termina
    // devagar (efeito "ease-in-out"), deixando o crescimento mais natural.
    function suavizar(progresso, inicio, fim) {
        const v = limitar((progresso - inicio) / (fim - inicio), 0, 1);
        return v * v * (3 - 2 * v);
    }

    // Calcula quanto da seção já foi rolado, de 0 a 1
    function calcularProgressoDaRolagem() {
        // Com "reduzir movimento", mostra direto o resultado final
        if (reduzirMovimento) return 1;

        // getBoundingClientRect().top = distância do topo da seção até o topo da tela.
        // Quando você rola, essa distância fica negativa; o "-" a torna positiva.
        const distanciaRolada = -secao.getBoundingClientRect().top;

        // Distância total que dá para rolar dentro da seção.
        // (altura da seção - altura da tela, porque a cena ocupa uma tela inteira)
        // Math.max(1, ...) evita dividir por zero.
        const distanciaTotal = Math.max(1, secao.offsetHeight - window.innerHeight);

        return limitar(distanciaRolada / distanciaTotal, 0, 1);
    }

    // Aplica um tamanho (scale) a uma peça do desenho.
    // Se "soNoEixoY" for true, estica só na altura (o tronco cresce para cima).
    function definirEscala(seletor, escala, soNoEixoY = false) {
        const peca = svg.querySelector(seletor);
        peca.style.transform = soNoEixoY ? `scaleY(${escala})` : `scale(${escala})`;
    }

    // ---------- Atualiza TUDO conforme a rolagem ----------
    function atualizarArvore() {
        atualizacaoAgendada = false;
        const progresso = calcularProgressoDaRolagem();

        // Cada peça tem a sua "janela" de tempo dentro do progresso geral:
        //
        //   semente  12% a 24%  -> some (opacidade vai de 1 para 0)
        //   tronco   14% a 50%  -> cresce para cima
        //   copa     38% a 72%  -> cresce
        //   floresta 76% a 98%  -> cresce (cada árvore um pouco depois da outra)
        svg.querySelector('.arvore-semente').style.opacity = 1 - suavizar(progresso, 0.12, 0.24);
        definirEscala('.arvore-tronco', suavizar(progresso, 0.14, 0.5), true);
        definirEscala('.arvore-copa', suavizar(progresso, 0.38, 0.72));

        // Árvores pequenas da floresta: o "index" (0, 1, 2, 3...) atrasa o começo
        // de cada uma em 0.025, criando um efeito de "uma depois da outra"
        svg.querySelectorAll('.arvore-floresta').forEach((arvore, index) => {
            const inicio = 0.76 + index * 0.025;
            arvore.style.transform = `scale(${suavizar(progresso, inicio, 0.98)})`;
        });

        // Qual das 4 frases está ativa? Divide o progresso em 4 partes iguais.
        // Math.floor arredonda para baixo; Math.min impede passar da última frase.
        const fraseAtiva = Math.min(
            frases.length - 1,
            Math.floor(progresso * frases.length)
        );

        // Barra de progresso: valor para leitores de tela e largura visual
        barraProgresso.setAttribute('aria-valuenow', String(Math.round(progresso * 100)));
        barraProgresso.firstElementChild.style.transform = `scaleX(${progresso})`;

        // Contador "01 / 04".
        // No HTML ele é:  01 <span>/ 04</span>
        // O firstChild é o texto "01 " (antes do <span>). Trocamos só esse pedaço.
        // padStart(2, '0') completa com zero à esquerda: 1 vira "01".
        contador.firstChild.textContent = `${String(fraseAtiva + 1).padStart(2, '0')} `;

        // Mostra só a frase ativa (a classe "ativo" deixa ela visível no CSS)
        frases.forEach((frase, index) => {
            frase.classList.toggle('ativo', index === fraseAtiva);
        });
    }

    // ---------- Desempenho ----------
    // O evento "scroll" dispara DEZENAS de vezes por segundo.
    // Para não sobrecarregar, pedimos ao navegador que atualize no máximo
    // UMA vez por quadro de tela (requestAnimationFrame).
    // A variável "atualizacaoAgendada" evita pedidos repetidos.
    function pedirAtualizacao() {
        if (!atualizacaoAgendada) {
            atualizacaoAgendada = true;
            window.requestAnimationFrame(atualizarArvore);
        }
    }

    // { passive: true } avisa ao navegador que não vamos bloquear a rolagem,
    // o que deixa a página mais fluida.
    window.addEventListener('scroll', pedirAtualizacao, { passive: true });
    window.addEventListener('resize', pedirAtualizacao);   // a tela mudou de tamanho

    // Desenha o estado inicial assim que a página carrega
    atualizarArvore();
}


/* =====================================================================
   3. FORMULÁRIO DE CONTATO (página Contato)

   Fluxo:
     1. A pessoa preenche os campos.
     2. Cada campo é validado ao SAIR dele (blur) e, se estiver com erro,
        a cada letra digitada (input).
     3. Ao enviar, valida tudo. Se houver erro, mostra e foca no 1º campo ruim.
     4. Se estiver tudo certo, simula o envio e mostra a mensagem de sucesso.
        (Não há servidor: o envio é só uma demonstração com setTimeout.)
   ===================================================================== */

function iniciarFormulario() {
    const formulario = document.getElementById('contact-form');
    if (!formulario) return;

    // Elementos da página que vamos usar
    const painelSucesso = document.getElementById('contact-success');
    const textoSucesso = document.getElementById('contact-success-text');
    const botaoReiniciar = document.getElementById('contact-reset');
    const areaStatus = document.getElementById('form-status');
    const botaoEnviar = formulario.querySelector('button[type="submit"]');

    // Um "objeto" que agrupa os 5 campos que validamos.
    // Para acessar um campo: campos.nome, campos.email...
    const campos = {
        nome: formulario.querySelector('#nome'),
        email: formulario.querySelector('#email'),
        telefone: formulario.querySelector('#telefone'),
        ajuda: formulario.querySelector('#ajuda'),
        mensagem: formulario.querySelector('#mensagem')
    };

    // ---------- Assunto vindo da URL ----------
    // Na página de acessibilidade, o botão leva para:
    //   contato.html?ajuda=acessibilidade
    // Aqui lemos o valor depois de "?ajuda=" e já selecionamos esse assunto.
    const assuntoPedido = new URLSearchParams(window.location.search).get('ajuda');

    // Só seleciona se esse valor realmente existe nas opções da lista
    // (some = "algum item atende à condição?")
    const assuntoExiste = Array.from(campos.ajuda.options)
        .some((opcao) => opcao.value === assuntoPedido);

    if (assuntoPedido && assuntoExiste) {
        campos.ajuda.value = assuntoPedido;
    }

    // ---------- Mensagens de erro de cada campo ----------
    const mensagensDeErro = {
        nome: 'Informe seu nome completo (mínimo de 3 caracteres).',
        email: 'Informe um e-mail válido, no formato nome@dominio.com.',
        telefone: 'Use um telefone com DDD, por exemplo (11) 90000-0000.',
        ajuda: 'Selecione o assunto da mensagem.',
        mensagem: 'Escreva uma mensagem com pelo menos 20 caracteres.'
    };

    // ---------- Regras de validação ----------

    // Expressão regular (regex) para e-mail. Lê-se assim:
    //   ^[^\s@]+   começa com 1 ou mais caracteres que não sejam espaço nem @
    //   @          depois um @
    //   [^\s@]+    mais caracteres (o domínio)
    //   \.         um ponto
    //   [^\s@]+$   mais caracteres até o fim (ex.: "com")
    function emailValido(valor) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
    }

    // Telefone é opcional: vazio é válido. Se preencheu, precisa de pelo
    // menos 10 números (DDD + número). replace(/\D/g, '') apaga tudo que
    // NÃO for dígito (parênteses, espaços, traços).
    function telefoneValido(valor) {
        return !valor || valor.replace(/\D/g, '').length >= 10;
    }

    // ---------- Mostrar ou limpar o erro de um campo ----------
    // Se "mensagem" tiver texto, mostra o erro. Se estiver vazia, limpa.
    function definirErroDoCampo(campo, mensagem) {
        const areaErro = document.getElementById(`${campo.id}-error`);

        // Boolean(mensagem) vira true se tiver texto e false se estiver vazia
        campo.classList.toggle('invalido', Boolean(mensagem));   // borda vermelha (CSS)
        campo.setAttribute('aria-invalid', mensagem ? 'true' : 'false');

        if (areaErro) {
            areaErro.textContent = mensagem || '';
        }
    }

    // ---------- Validar um campo ----------
    // Devolve true (válido) ou false (inválido) e atualiza a tela.
    function validarCampo(campo) {
        const valor = campo.value.trim();   // trim() remove espaços do começo e do fim
        let mensagem = '';

        if (campo.id === 'nome' && valor.length < 3) {
            mensagem = mensagensDeErro.nome;
        } else if (campo.id === 'email' && !emailValido(valor)) {
            mensagem = mensagensDeErro.email;
        } else if (campo.id === 'telefone' && !telefoneValido(valor)) {
            mensagem = mensagensDeErro.telefone;
        } else if (campo.id === 'ajuda' && !valor) {
            mensagem = mensagensDeErro.ajuda;
        } else if (campo.id === 'mensagem' && valor.length < 20) {
            mensagem = mensagensDeErro.mensagem;
        }

        definirErroDoCampo(campo, mensagem);
        return !mensagem;   // sem mensagem de erro = campo válido
    }

    // ---------- Validação enquanto a pessoa preenche ----------
    // Object.values(campos) transforma o objeto em uma lista dos 5 campos.
    Object.values(campos).forEach((campo) => {
        // "blur" = a pessoa saiu do campo: valida
        campo.addEventListener('blur', () => validarCampo(campo));

        // "input" = a pessoa digitou algo. Só revalida se o campo JÁ está com erro,
        // para o erro sumir assim que a pessoa corrigir (sem incomodar antes disso).
        campo.addEventListener('input', () => {
            if (campo.classList.contains('invalido')) {
                validarCampo(campo);
            }
        });
    });

    // ---------- Envio do formulário ----------
    formulario.addEventListener('submit', (evento) => {
        // Impede o comportamento padrão (recarregar a página)
        evento.preventDefault();

        // Valida TODOS os campos (isso também mostra todos os erros de uma vez).
        // filter guarda só os campos que NÃO passaram na validação.
        const camposInvalidos = Object.values(campos).filter((campo) => !validarCampo(campo));

        if (camposInvalidos.length > 0) {
            areaStatus.textContent = 'Revise os campos destacados antes de enviar.';
            camposInvalidos[0].focus();   // leva o cursor ao primeiro campo com erro
            return;                       // para aqui e não envia
        }

        // Tudo certo: limpa o aviso e trava o botão para evitar clique duplo
        areaStatus.textContent = '';
        botaoEnviar.disabled = true;
        botaoEnviar.textContent = 'Enviando...';

        // Simula o tempo de um envio real (450 milissegundos)
        window.setTimeout(() => {
            // Pega só o primeiro nome: "Maria da Silva" -> "Maria"
            const primeiroNome = campos.nome.value.trim().split(' ')[0];
            const email = campos.email.value.trim();

            textoSucesso.textContent =
                `Recebemos sua mensagem, ${primeiroNome}. Retornamos em breve pelo e-mail ${email}.`;

            // Troca o formulário pela mensagem de sucesso
            formulario.hidden = true;
            painelSucesso.hidden = false;
            painelSucesso.querySelector('h3').focus();   // leitores de tela anunciam o sucesso

            // Devolve o botão ao estado normal (para o caso de enviar outra mensagem)
            botaoEnviar.disabled = false;
            botaoEnviar.textContent = 'Enviar mensagem';
        }, 450);
    });

    // ---------- Botão "Enviar outra mensagem" ----------
    botaoReiniciar.addEventListener('click', () => {
        formulario.reset();   // limpa o que foi digitado
        Object.values(campos).forEach((campo) => definirErroDoCampo(campo, ''));
        areaStatus.textContent = '';
        painelSucesso.hidden = true;
        formulario.hidden = false;
        campos.nome.focus();
    });
}


/* =====================================================================
   4. GALERIA (página Galeria)

   Dois recursos:
     a) Filtros: mostram só as imagens de uma categoria.
     b) Janela (<dialog>): ao clicar em uma imagem, mostra ela ampliada.

   Os dados vêm do HTML:
     - cada imagem tem  data-category="preservacao" (ou impacto, fauna...)
     - cada botão de filtro tem  data-gallery-filter="preservacao"
     No JavaScript, "data-algo" vira "dataset.algo".
   ===================================================================== */

function iniciarGaleria() {
    const grade = document.querySelector('.galeria-grade');
    if (!grade) return;

    const itens = Array.from(grade.querySelectorAll('.galeria-item'));
    const filtros = Array.from(document.querySelectorAll('[data-gallery-filter]'));
    const contador = document.querySelector('.galeria-contador');
    const janela = document.getElementById('gallery-dialog');
    const imagemDaJanela = document.getElementById('gallery-dialog-image');
    const legendaDaJanela = document.getElementById('gallery-dialog-caption');

    // ---------- a) Filtros ----------
    filtros.forEach((botao) => {
        botao.addEventListener('click', () => {
            // Categoria do botão clicado: "all", "preservacao", "impacto"...
            const categoria = botao.dataset.galleryFilter;
            let quantidadeVisivel = 0;

            // 1) Marca só o botão clicado como ativo (os outros perdem a marcação)
            filtros.forEach((outroBotao) => {
                const estaAtivo = outroBotao === botao;
                outroBotao.classList.toggle('ativo', estaAtivo);
                outroBotao.setAttribute('aria-pressed', String(estaAtivo));
            });

            // 2) Mostra ou esconde cada imagem
            itens.forEach((item) => {
                const deveAparecer = categoria === 'all' || item.dataset.category === categoria;
                item.hidden = !deveAparecer;

                // Number(true) = 1 e Number(false) = 0: assim contamos as visíveis
                quantidadeVisivel += Number(deveAparecer);
            });

            // 3) Atualiza o texto do contador: "1 imagem" ou "5 imagens"
            const palavra = quantidadeVisivel === 1 ? 'imagem' : 'imagens';
            contador.textContent = `${quantidadeVisivel} ${palavra}`;
        });
    });

    // ---------- b) Janela com a imagem ampliada ----------
    // Usamos UM ouvinte na grade inteira (em vez de um por imagem).
    // Quando alguém clica em qualquer lugar da grade, descobrimos se foi
    // em um botão ".galeria-abrir".
    grade.addEventListener('click', (evento) => {
        const botaoAbrir = evento.target.closest('.galeria-abrir');
        if (!botaoAbrir) return;   // clicou em outra coisa: ignora

        const imagem = botaoAbrir.querySelector('img');
        const titulo = botaoAbrir.closest('figure').querySelector('figcaption strong').textContent;

        // Copia a imagem, a descrição (alt) e o título para dentro da janela
        imagemDaJanela.src = imagem.src;
        imagemDaJanela.alt = imagem.alt;
        legendaDaJanela.textContent = titulo;

        // showModal() abre o <dialog> por cima de tudo, com fundo escuro.
        // O navegador cuida do foco e da tecla Esc automaticamente.
        janela.showModal();
    });

    // Clique FORA da janela (no fundo escuro) fecha ela.
    // Quando o clique é no fundo, o alvo do evento é o próprio <dialog>.
    janela.addEventListener('click', (evento) => {
        if (evento.target === janela) {
            janela.close();
        }
    });
}


/* =====================================================================
   5. COLOCANDO TUDO PARA FUNCIONAR
   Chama as 4 funções. Cada uma decide sozinha se tem algo a fazer
   na página atual (a "guarda" do início de cada função).
   ===================================================================== */

iniciarMenu();
iniciarArvore();
iniciarFormulario();
iniciarGaleria();