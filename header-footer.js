(function() {
  var header = document.querySelector('.dr-header');
  if (!header) return;

  var toggle = header.querySelector('.dr-nav-toggle');
  var nav = header.querySelector('.dr-nav');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', function() {
    var isExpanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!isExpanded));
    if (!isExpanded) {
      header.classList.add('nav-open');
    } else {
      header.classList.remove('nav-open');
    }
  });
})();
