"use strict";
// DOM ELEMENTS
const form = document.querySelector(".activity-form");
const distanceInp = document.querySelector("#distance");
const durationInp = document.querySelector("#duration");
const cadenceInp = document.querySelector("#cadence");
const ElevGainInp = document.querySelector("#ElevGain");
const typeInp = document.querySelector("#type");
const workoutContainer = document.querySelector(".activities");
const reset = document.querySelector("#reset");
// console.log(ElevGainInp);
// CLASSES
class Workout {
  date = new Date();
  id = (Date.now() + "").slice(-10);
  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }
  _getDescription() {
    // prettier-ignore
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}
class Running extends Workout {
  type = "running";
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._getDescription();
  }
  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
    // console.log(this.pace);
  }
}
class Cycling extends Workout {
  type = "cycling";
  constructor(coords, distance, duration, elevGain) {
    super(coords, distance, duration);
    this.elevGain = elevGain;
    this.calcSpeed();
    this._getDescription();
  }
  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
    // console.log(this.speed);
  }
}
class App {
  #map;
  #mapEvent;
  #workouts = [];
  #data;
  constructor() {
    // get position
    this._getPosition();
    // get data from local storage
    this._getData();
    form.addEventListener("keydown", this._newWorkout.bind(this));
    typeInp.addEventListener("change", this._toggleCadenceElevGain.bind(this));
    workoutContainer.addEventListener("click", this._moveToMarker.bind(this));
    reset.addEventListener("click", this.reset);
  }
  _getPosition() {
    navigator.geolocation.getCurrentPosition(
      this._loadMap.bind(this),
      function () {
        alert("Could not get your position");
      }
    );
  }
  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    const coords = [latitude, longitude];
    // console.log(latitude, longitude);

    this.#map = L.map("map").setView(coords, 13);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);
    this.#map.on("click", this._showForm.bind(this));
    if (!this.#data) return;
    this.#workouts.forEach((workout) => this._renderMarker(workout));
  }
  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove("form-hidden");
  }
  _toggleCadenceElevGain() {
    ElevGainInp.closest(".activity-row").classList.toggle("form-hidden");
    cadenceInp.closest(".activity-row").classList.toggle("form-hidden");
  }
  _renderMarker(workout) {
    distanceInp.value =
      durationInp.value =
      cadenceInp.value =
      ElevGainInp.value =
        "";
    form.classList.add("form-hidden");
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 350,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === "running" ? "🏃‍♂️" : "🚴‍♂️"} ${workout.description}`
      )
      .openPopup();
  }
  _newWorkout(e) {
    const allPositive = (...inputs) => inputs.every((inp) => inp > 0);
    if (e.key === "Enter") {
      // get the form data
      let workout;
      const type = typeInp.value;
      const distance = +distanceInp.value; // convert to number
      const duration = +durationInp.value; // convert to number
      const { lat, lng } = this.#mapEvent.latlng;

      if (type === "running") {
        const cadence = +cadenceInp.value;
        if (!allPositive(distance, duration, cadence))
          return alert("not a valid number");
        workout = new Running([lat, lng], distance, duration, cadence);
        this._renderMarker(workout);
        console.log(this.#workouts);
        this.#workouts.push(workout);
        // console.log(workout);
      }
      if (type === "cycling") {
        const elevGain = ElevGainInp.value;
        if (!allPositive(distance, duration))
          return alert("not a valid number");
        workout = new Cycling([lat, lng], distance, duration, elevGain);
        this._renderMarker(workout);
        this.#workouts.push(workout);
        // console.log(workout);
      }
      // console.log(this);
      this._renderWorkout(workout);
      reset.classList.remove("form-hidden");
    }
    this._setToLocalStorage();
  }
  _renderWorkout(workout) {
    const html = `<div class="activity activity-${workout.type}" data-id="${
      workout.id
    }">
        <div class="activity-date">
          ${workout.description}
        </div>
        <div class="activity-data">
          <div>
            <h3>
              <span class="icon">${
                workout.type === "running" ? "🏃‍♂️" : "🚴‍♂️"
              }</span> <span class="value">${workout.distance}</span> KM
            </h3>
          </div>
          <div>
            <h3>
              <span class="icon">⏱</span> <span class="value">${
                workout.duration
              }</span> MIN
            </h3>
          </div>
          <div>
            <h3>
              <span class="icon">⚡</span>
              <span class="value">${
                workout.type === "running"
                  ? workout.pace.toFixed(1)
                  : workout.speed.toFixed(1)
              }</span> ${workout.type === "running" ? "MIN/KM" : "KM/H"}
            </h3>
          </div>
          <div>
            <h3>
              <span class="icon">${
                workout.type === "running" ? "🦶" : "🗻"
              }</span> <span class="value">${
      workout.type === "running" ? workout.cadence : workout.elevGain
    }</span> ${workout.type === "running" ? "SPM" : "M"}
            </h3>
          </div>
        </div>
        </div>`;
    form.insertAdjacentHTML("afterend", html);
  }
  _moveToMarker(e) {
    const workoutEl = e.target.closest(".activity");
    if (!workoutEl) return;
    // console.log(workoutEl);
    const workout = this.#workouts.find(
      (work) => work.id === workoutEl.dataset.id
    );
    this.#map.setView(workout.coords, 14, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
    // console.log(workout);
  }
  _setToLocalStorage() {
    localStorage.setItem("workouts", JSON.stringify(this.#workouts));
  }
  _getData() {
    this.#data = JSON.parse(localStorage.getItem("workouts"));
    // console.log(data);
    if (!this.#data) return;
    this.#workouts = this.#data;
    this.#workouts.forEach((workout) => this._renderWorkout(workout));
  }
  reset() {
    localStorage.removeItem("workouts");
    location.reload();
  }
}

// APP
const app = new App();
