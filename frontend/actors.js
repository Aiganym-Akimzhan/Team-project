var actors = [
  { ru: "Леонардо ДиКаприо", en: "Leonardo DiCaprio", photo: "" },
  { ru: "Марго Робби", en: "Margot Robbie", photo: "" },
  { ru: "Том Харди", en: "Tom Hardy", photo: "" },
  { ru: "Эмма Стоун", en: "Emma Stone", photo: "" },
  { ru: "Райан Гослинг", en: "Ryan Gosling", photo: "" },
  { ru: "Зендея", en: "Zendaya", photo: "" },
  { ru: "Роберт Дауни-мл.", en: "Robert Downey Jr.", photo: "" },
  { ru: "Скарлетт Йоханссон", en: "Scarlett Johansson", photo: "" },
  { ru: "Киану Ривз", en: "Keanu Reeves", photo: "" },
  { ru: "Дженнифер Лоуренс", en: "Jennifer Lawrence", photo: "" },
  { ru: "Уилл Смит", en: "Will Smith", photo: "" },
  { ru: "Энн Хэтэуэй", en: "Anne Hathaway", photo: "" },
];

var actorsTrack = document.getElementById("actorsTrack");

function loadPhoto(box, actor) {
  if (actor.photo) {
    box.innerHTML = `<img src="${actor.photo}" alt="${actor.en}">`;
    return;
  }

  var page = actor.en.replace(/ /g, "_");

  fetch("https://en.wikipedia.org/api/rest_v1/page/summary/" + page)
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {
      if (data.thumbnail) {
        box.innerHTML = `<img src="${data.thumbnail.source}" alt="${actor.en}">`;
      }
    })
    .catch(function () {});
}

actors.forEach(function (actor) {
  var card = document.createElement("div");
  card.className = "actor";

  var words = actor.en.split(" ");
  var initials = words[0][0];
  if (words.length > 1) initials += words[1][0];

  card.innerHTML = `
    <div class="actor-photo">${initials}</div>
    <div class="actor-ru">${actor.ru}</div>
    <div class="actor-en">${actor.en}</div>
  `;

  actorsTrack.appendChild(card);
  loadPhoto(card.querySelector(".actor-photo"), actor);
});

document.getElementById("actorsLeft").onclick = function () {
  actorsTrack.scrollBy({ left: -600, behavior: "smooth" });
};

document.getElementById("actorsRight").onclick = function () {
  actorsTrack.scrollBy({ left: 600, behavior: "smooth" });
};
