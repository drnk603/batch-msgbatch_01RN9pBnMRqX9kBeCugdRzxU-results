(function() {
  'use strict';

  if (window.__appInit) return;
  window.__appInit = true;

  const state = {
    menuOpen: false,
    formsRegistered: false,
    scrollSpyActive: false
  };

  const config = {
    headerOffset: 80,
    debounceDelay: 150,
    throttleDelay: 100
  };

  function debounce(func, wait) {
    let timeout;
    return function() {
      const context = this;
      const args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), wait);
    };
  }

  function throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  function getHeaderOffset() {
    const header = document.querySelector('.l-header, .navbar, header');
    return header ? header.offsetHeight : config.headerOffset;
  }

  function initBurgerMenu() {
    const toggle = document.querySelector('.navbar-toggler');
    const collapse = document.querySelector('.navbar-collapse');
    const navLinks = document.querySelectorAll('.nav-link');
    const body = document.body;

    if (!toggle || !collapse) return;

    function openMenu() {
      state.menuOpen = true;
      collapse.classList.add('show');
      toggle.setAttribute('aria-expanded', 'true');
      body.classList.add('u-no-scroll');
    }

    function closeMenu() {
      state.menuOpen = false;
      collapse.classList.remove('show');
      toggle.setAttribute('aria-expanded', 'false');
      body.classList.remove('u-no-scroll');
    }

    function toggleMenu() {
      state.menuOpen ? closeMenu() : openMenu();
    }

    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleMenu();
    });

    document.addEventListener('click', (e) => {
      if (state.menuOpen && !collapse.contains(e.target) && !toggle.contains(e.target)) {
        closeMenu();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && state.menuOpen) {
        closeMenu();
        toggle.focus();
      }
    });

    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        if (state.menuOpen) closeMenu();
      });
    });

    window.addEventListener('resize', debounce(() => {
      if (window.innerWidth >= 1024 && state.menuOpen) {
        closeMenu();
      }
    }, config.debounceDelay));
  }

  function initSmoothScroll() {
    document.addEventListener('click', (e) => {
      let target = e.target;
      while (target && target.tagName !== 'A') {
        target = target.parentElement;
      }
      if (!target) return;

      const href = target.getAttribute('href');
      if (!href || href === '#' || href === '#!') {
        e.preventDefault();
        return;
      }

      if (href.startsWith('#')) {
        e.preventDefault();
        const id = href.substring(1);
        const element = document.getElementById(id);
        if (element) {
          const offset = getHeaderOffset();
          const top = element.getBoundingClientRect().top + window.pageYOffset - offset;
          window.scrollTo({ top: top, behavior: 'smooth' });
        }
      } else if (href.startsWith('/#')) {
        const currentPath = window.location.pathname;
        const isHome = currentPath === '/' || currentPath.endsWith('/index.html');
        if (isHome) {
          e.preventDefault();
          const id = href.substring(2);
          const element = document.getElementById(id);
          if (element) {
            const offset = getHeaderOffset();
            const top = element.getBoundingClientRect().top + window.pageYOffset - offset;
            window.scrollTo({ top: top, behavior: 'smooth' });
          }
        }
      }
    });
  }

  function initScrollSpy() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    if (sections.length === 0 || navLinks.length === 0) return;

    const observerCallback = throttle(() => {
      const scrollPos = window.pageYOffset + getHeaderOffset() + 50;
      let currentSection = null;

      sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
          currentSection = section.id;
        }
      });

      navLinks.forEach(link => {
        link.classList.remove('active');
        link.removeAttribute('aria-current');
        const href = link.getAttribute('href');
        if (href && (href === `#${currentSection}` || href === `/#${currentSection}`)) {
          link.classList.add('active');
          link.setAttribute('aria-current', 'page');
        }
      });
    }, config.throttleDelay);

    window.addEventListener('scroll', observerCallback, { passive: true });
    observerCallback();
  }

  function initActiveMenu() {
    const pathname = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(link => {
      link.classList.remove('active');
      link.removeAttribute('aria-current');

      const href = link.getAttribute('href');
      if (!href) return;

      const linkPath = href.split('#')[0];
      const isHome = pathname === '/' || pathname.endsWith('/index.html');
      const linkIsHome = linkPath === '/' || linkPath === '/index.html' || linkPath === 'index.html';

      if (linkPath === pathname || (isHome && linkIsHome)) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      }
    });
  }

  function showNotification(message, type) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.style.position = 'fixed';
      container.style.top = '20px';
      container.style.right = '20px';
      container.style.zIndex = '9999';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `alert alert-${type || 'info'} alert-dismissible fade show`;
    toast.setAttribute('role', 'alert');
    toast.style.minWidth = '250px';
    toast.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
    toast.textContent = message;

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'btn-close';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.addEventListener('click', () => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 150);
    });
    toast.appendChild(closeBtn);

    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 150);
    }, 5000);
  }

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function validateField(field) {
    const value = field.value.trim();
    const type = field.type;
    const id = field.id;
    const name = field.name;

    field.classList.remove('is-invalid');
    let feedbackEl = field.parentElement.querySelector('.invalid-feedback');
    if (feedbackEl) feedbackEl.remove();

    if (field.hasAttribute('required') && !value) {
      field.classList.add('is-invalid');
      addFeedback(field, 'This field is required.');
      return false;
    }

    if (type === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        field.classList.add('is-invalid');
        addFeedback(field, 'Please enter a valid email address.');
        return false;
      }
    }

    if (type === 'tel' && value) {
      const phoneRegex = /^[\d\s\+\-\(\)]{10,20}$/;
      if (!phoneRegex.test(value)) {
        field.classList.add('is-invalid');
        addFeedback(field, 'Please enter a valid phone number (10-20 characters).');
        return false;
      }
    }

    if ((id === 'firstName' || id === 'lastName' || name === 'firstName' || name === 'lastName') && value) {
      const nameRegex = /^[a-zA-ZÀ-ÿ\s\-']{2,50}$/;
      if (!nameRegex.test(value)) {
        field.classList.add('is-invalid');
        addFeedback(field, 'Name must be 2-50 characters (letters, spaces, hyphens, apostrophes only).');
        return false;
      }
    }

    if (field.tagName === 'TEXTAREA' && value && value.length < 10) {
      field.classList.add('is-invalid');
      addFeedback(field, 'Message must be at least 10 characters.');
      return false;
    }

    if (type === 'checkbox' && field.hasAttribute('required') && !field.checked) {
      field.classList.add('is-invalid');
      addFeedback(field, 'You must accept this to continue.');
      return false;
    }

    if (field.tagName === 'SELECT' && field.hasAttribute('required') && !value) {
      field.classList.add('is-invalid');
      addFeedback(field, 'Please select an option.');
      return false;
    }

    return true;
  }

  function addFeedback(field, message) {
    const feedback = document.createElement('div');
    feedback.className = 'invalid-feedback';
    feedback.textContent = message;
    feedback.style.display = 'block';
    field.parentElement.appendChild(feedback);
  }

  function initForms() {
    if (state.formsRegistered) return;
    state.formsRegistered = true;

    const forms = document.querySelectorAll('form.c-form, form.needs-validation, form[id]');

    forms.forEach(form => {
      const fields = form.querySelectorAll('input, textarea, select');

      fields.forEach(field => {
        field.addEventListener('blur', () => validateField(field));
        field.addEventListener('input', () => {
          if (field.classList.contains('is-invalid')) {
            validateField(field);
          }
        });
      });

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        e.stopPropagation();

        form.classList.add('was-validated');

        let isValid = true;
        fields.forEach(field => {
          if (!validateField(field)) {
            isValid = false;
          }
        });

        if (!isValid) {
          showNotification('Please fill in all required fields correctly.', 'danger');
          return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn ? submitBtn.innerHTML : '';

        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Sending...';
        }

        const formData = new FormData(form);
        const data = {};
        formData.forEach((value, key) => {
          data[key] = escapeHTML(value);
        });

        setTimeout(() => {
          showNotification('Form submitted successfully!', 'success');
          form.reset();
          form.classList.remove('was-validated');
          fields.forEach(field => field.classList.remove('is-invalid'));

          setTimeout(() => {
            window.location.href = '/thank_you.html';
          }, 1000);

          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
          }
        }, 1500);
      });
    });
  }

  function initImages() {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      if (!img.hasAttribute('loading') && !img.classList.contains('c-logo__img')) {
        img.setAttribute('loading', 'lazy');
      }
      if (!img.classList.contains('img-fluid')) {
        img.classList.add('img-fluid');
      }
      if (!img.dataset.errorHandled) {
        img.addEventListener('error', function handleError() {
          if (img.dataset.errorHandled) return;
          img.dataset.errorHandled = 'true';
          const placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23e9ecef" width="400" height="300"/%3E%3Ctext fill="%236c757d" font-family="sans-serif" font-size="18" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage unavailable%3C/text%3E%3C/svg%3E';
          img.src = placeholder;
        });
      }
    });
  }

  function init() {
    initBurgerMenu();
    initSmoothScroll();
    initActiveMenu();
    initScrollSpy();
    initForms();
    initImages();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();