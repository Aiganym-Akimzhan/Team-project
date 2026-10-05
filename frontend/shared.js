function loadDocument(link, query) {
  fetch(link).then((response) => {
    if (!response.ok) {
      throw new Error("Could not load " + link);
    }

    response.text().then((text) => {
      document.querySelectorAll(query).forEach((doc) => {
        doc.innerHTML = text;
      });

      if (query === 'section[name="navbar"]') {
        loadNavbar();
      }
    });
  });
}

loadDocument("/navbar/index.html", 'section[name="navbar"]');
loadDocument("/footer/footer.html", 'section[name="footer"]');
