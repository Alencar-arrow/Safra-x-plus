const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('nav-menu');

if (hamburger && navMenu) {
    const closeMenu = () => {
        navMenu.classList.remove('ativo');
        hamburger.setAttribute('aria-expanded', 'false');
        hamburger.setAttribute('aria-label', 'Abrir menu');
    };

    hamburger.addEventListener('click', () => {
        const isExpanded = hamburger.getAttribute('aria-expanded') === 'true';
        hamburger.setAttribute('aria-expanded', String(!isExpanded));
        hamburger.setAttribute('aria-label', isExpanded ? 'Abrir menu' : 'Fechar menu');
        navMenu.classList.toggle('ativo', !isExpanded);
    });

    navMenu.addEventListener('click', (event) => {
        if (event.target.closest('a')) {
            closeMenu();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && hamburger.getAttribute('aria-expanded') === 'true') {
            closeMenu();
            hamburger.focus();
        }
    });
}

const treeGrowth = document.querySelector('.arvore-crescimento-secao');

if (treeGrowth) {
    treeGrowth.classList.add('animada');
    const treeSvg = treeGrowth.querySelector('.arvore-crescimento');
    const treeSteps = Array.from(treeGrowth.querySelectorAll('.arvore-crescimento-etapas p'));
    const treeProgress = treeGrowth.querySelector('.arvore-crescimento-progresso');
    const treeStepCount = treeGrowth.querySelector('.arvore-crescimento-etapa-contador');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let treeFramePending = false;

    const progressBetween = (progress, start, end) => {
        const value = Math.max(0, Math.min(1, (progress - start) / (end - start)));
        return value * value * (3 - 2 * value);
    };

    const updateTreeGrowth = () => {
        treeFramePending = false;
        const sectionProgress = reducedMotion
            ? 1
            : Math.max(0, Math.min(1,
                -treeGrowth.getBoundingClientRect().top /
                Math.max(1, treeGrowth.offsetHeight - window.innerHeight)
            ));

        const setScale = (selector, scale, axis = false) => {
            treeSvg.querySelector(selector).style.transform = axis
                ? `scaleY(${scale})`
                : `scale(${scale})`;
        };

        treeSvg.querySelector('.arvore-semente').style.opacity =
            1 - progressBetween(sectionProgress, 0.12, 0.24);
        setScale('.arvore-tronco', progressBetween(sectionProgress, 0.14, 0.5), true);
        setScale('.arvore-copa', progressBetween(sectionProgress, 0.38, 0.72));

        treeSvg.querySelectorAll('.arvore-floresta').forEach((tree, index) => {
            tree.style.transform = `scale(${progressBetween(sectionProgress, 0.76 + index * 0.025, 0.98)})`;
        });

        const activeStep = Math.min(
            treeSteps.length - 1,
            Math.floor(sectionProgress * treeSteps.length)
        );

        treeProgress.setAttribute('aria-valuenow', String(Math.round(sectionProgress * 100)));
        treeProgress.firstElementChild.style.transform = `scaleX(${sectionProgress})`;
        treeStepCount.firstChild.textContent = `${String(activeStep + 1).padStart(2, '0')} `;

        treeSteps.forEach((step, index) => {
            step.classList.toggle('ativo', index === activeStep);
        });
    };

    const requestTreeUpdate = () => {
        if (!treeFramePending) {
            treeFramePending = true;
            window.requestAnimationFrame(updateTreeGrowth);
        }
    };

    window.addEventListener('scroll', requestTreeUpdate, { passive: true });
    window.addEventListener('resize', requestTreeUpdate);
    updateTreeGrowth();
}

const contactForm = document.getElementById('contact-form');

if (contactForm) {
    const successPanel = document.getElementById('contact-success');
    const successText = document.getElementById('contact-success-text');
    const resetButton = document.getElementById('contact-reset');
    const formStatus = document.getElementById('form-status');
    const submitButton = contactForm.querySelector('button[type="submit"]');
    const fields = {
        nome: contactForm.querySelector('#nome'),
        email: contactForm.querySelector('#email'),
        telefone: contactForm.querySelector('#telefone'),
        ajuda: contactForm.querySelector('#ajuda'),
        mensagem: contactForm.querySelector('#mensagem')
    };

    const requestedSubject = new URLSearchParams(window.location.search).get('ajuda');
    if (requestedSubject && Array.from(fields.ajuda.options).some((option) => option.value === requestedSubject)) {
        fields.ajuda.value = requestedSubject;
    }

    const messages = {
        nome: 'Informe seu nome completo (mínimo de 3 caracteres).',
        email: 'Informe um e-mail válido, no formato nome@dominio.com.',
        telefone: 'Use um telefone com DDD, por exemplo (11) 90000-0000.',
        ajuda: 'Selecione o assunto da mensagem.',
        mensagem: 'Escreva uma mensagem com pelo menos 20 caracteres.'
    };

    const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    const isValidPhone = (value) => !value || value.replace(/\D/g, '').length >= 10;

    const setFieldError = (field, message) => {
        const error = document.getElementById(`${field.id}-error`);
        field.classList.toggle('invalido', Boolean(message));
        field.setAttribute('aria-invalid', message ? 'true' : 'false');
        if (error) {
            error.textContent = message || '';
        }
    };

    const validateField = (field) => {
        const value = field.value.trim();
        let message = '';

        if (field.id === 'nome' && value.length < 3) {
            message = messages.nome;
        } else if (field.id === 'email' && !isValidEmail(value)) {
            message = messages.email;
        } else if (field.id === 'telefone' && !isValidPhone(value)) {
            message = messages.telefone;
        } else if (field.id === 'ajuda' && !value) {
            message = messages.ajuda;
        } else if (field.id === 'mensagem' && value.length < 20) {
            message = messages.mensagem;
        }

        setFieldError(field, message);
        return !message;
    };

    Object.values(fields).forEach((field) => {
        field.addEventListener('blur', () => validateField(field));
        field.addEventListener('input', () => {
            if (field.classList.contains('invalido')) {
                validateField(field);
            }
        });
    });

    contactForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const invalid = Object.values(fields).filter((field) => !validateField(field));

        if (invalid.length) {
            formStatus.textContent = 'Revise os campos destacados antes de enviar.';
            invalid[0].focus();
            return;
        }

        formStatus.textContent = '';
        submitButton.disabled = true;
        submitButton.textContent = 'Enviando...';

        window.setTimeout(() => {
            const name = fields.nome.value.trim().split(' ')[0];
            successText.textContent = `Recebemos sua mensagem, ${name}. Retornamos em breve pelo e-mail ${fields.email.value.trim()}.`;
            contactForm.hidden = true;
            successPanel.hidden = false;
            successPanel.querySelector('h3').focus();
            submitButton.disabled = false;
            submitButton.textContent = 'Enviar mensagem';
        }, 450);
    });

    resetButton.addEventListener('click', () => {
        contactForm.reset();
        Object.values(fields).forEach((field) => setFieldError(field, ''));
        formStatus.textContent = '';
        successPanel.hidden = true;
        contactForm.hidden = false;
        fields.nome.focus();
    });
}

const galleryGrid = document.querySelector('.galeria-grade');

if (galleryGrid) {
    const galleryItems = Array.from(galleryGrid.querySelectorAll('.galeria-item'));
    const galleryFilters = Array.from(document.querySelectorAll('[data-gallery-filter]'));
    const galleryCount = document.querySelector('.galeria-contador');
    const galleryDialog = document.getElementById('gallery-dialog');
    const galleryDialogImage = document.getElementById('gallery-dialog-image');
    const galleryDialogCaption = document.getElementById('gallery-dialog-caption');

    galleryFilters.forEach((filter) => {
        filter.addEventListener('click', () => {
            const category = filter.dataset.galleryFilter;
            let visibleCount = 0;

            galleryFilters.forEach((button) => {
                const isActive = button === filter;
                button.classList.toggle('ativo', isActive);
                button.setAttribute('aria-pressed', String(isActive));
            });

            galleryItems.forEach((item) => {
                const isVisible = category === 'all' || item.dataset.category === category;
                item.hidden = !isVisible;
                visibleCount += Number(isVisible);
            });

            galleryCount.textContent = `${visibleCount} ${visibleCount === 1 ? 'imagem' : 'imagens'}`;
        });
    });

    galleryGrid.addEventListener('click', (event) => {
        const trigger = event.target.closest('.galeria-abrir');
        if (!trigger) return;

        const image = trigger.querySelector('img');
        galleryDialogImage.src = image.src;
        galleryDialogImage.alt = image.alt;
        galleryDialogCaption.textContent = trigger.closest('figure').querySelector('figcaption strong').textContent;
        galleryDialog.showModal();
    });

    galleryDialog.addEventListener('click', (event) => {
        if (event.target === galleryDialog) galleryDialog.close(); // quando clica fora fecha.
    });
}