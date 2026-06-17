(function () {
  var buttons = document.querySelectorAll('.theme-btn');

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('diary-theme', theme);
    buttons.forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-theme') === theme);
    });
  }

  buttons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      setTheme(btn.getAttribute('data-theme'));
    });
  });

  setTheme(document.documentElement.getAttribute('data-theme') || 'light');
})();
