import config from './config.js';

const firstapiURL = "https://www.polovniautomobili.com/json/v1/getLast24hAds/26/1";
const fetchCityURL = "https://maps.googleapis.com/maps/api/geocode/json?&address=";

Vue.component('list', {
  props: ['finalresults'],
  template: `
    <div style="width: 35vw; grid-column: 3;">
      <div class="card" v-for="result in this.finalresults">
        <img v-if="result.photoLink" class="card-img-top" v-bind:src="result.photoLink[2]">
        <div class="card-body">
          <h4 class="text-center"> {{ result.title }}</h4>
          <h5 class="text-center text-primary"> {{ result.city }} </h5>
          <p class="card-text">{{ result.tag_block }}</p>
          <hr>
          <div class="text-center">
            <a class="btn btn-danger" v-bind:href="'https://www.polovniautomobili.com' + result.url" target="_blank" rel="noopener noreferrer">
              <strong>
                <div class="text-center" v-if="result.price === 999999999">
                  Po dogovoru
                </div>
                <div class="text-center" v-else>
                  {{ result.price }} €
                </div>
              </strong>
            </a>
          </div>
        </div>
      </div>
    </div>
  `,
});

const vm = new Vue({
  el: '#app',
  data: {
    pageCount: 0,
    results: [],
    finalresults: [],
    map: "",
    serbia: {lat: 44.246, lng: 20.26},
    markers: [],
    newcity: {},
    title: ""
  },
  mounted: function() {
    this.getAds();
  },
  methods: {
    getAds() {
      this.map = new google.maps.Map(
          document.getElementById('map'), {zoom: 7, center: this.serbia});

      this.title = "Updating...";
      axios.get(firstapiURL)
      .then((response) => {
        this.pageCount = Math.ceil(response.data.totalResults / 25);
        console.log(this.pageCount);
        })
      .catch(error => console.error(error));

      setTimeout(() => {
        this.parseAds();
      }, 1000);

      setTimeout(() => {
        console.log('Sorting...');
        this.results.sort(function(a,b) { return a.AdID < b.AdID ? 1 : (a.AdID > b.AdID ? -1 : 0); });
        this.finalresults = this.results.slice(0, config.adsToDisplay);
        this.title = "PolovniAutomobili UŽIVO";
      }, 5000);
      

      /* Repetitive work starts here */

      setInterval(() => {
        this.results = [];
        this.title = "Updating...";

        setTimeout(() => {
          this.parseAds();
        }, 1000);
  
        setTimeout(() => {
          console.log('Sorting...');
          this.results.sort(function(a,b) { return a.AdID < b.AdID ? 1 : (a.AdID > b.AdID ? -1 : 0); });
          this.finalresults = this.results.slice(0, config.adsToDisplay);
          this.title = "PolovniAutomobili UŽIVO";

          axios.get(`${fetchCityURL}${this.finalresults[0].city}`)
          .then((response) => {
            this.markers.push(new google.maps.Marker(
              {
                position: {lat: response.data.results[0].geometry.location.lat, lng: response.data.results[0].geometry.location.lng},
                map: this.map
              }
            ));
          })
          .catch(error => console.log(error));

        }, 5000);
      }, config.refreshInterval);
      
    },
    parseAds() {
      for(var i = 1; i <= this.pageCount; i++)
      {
        axios.get(`https://www.polovniautomobili.com/json/v1/getLast24hAds/26/${i}`)
        .then((response) => {
          for(var j = 0; j < 25; j++)
          {
            this.results.push(response.data.classifieds[j]);
          }
        })
        .catch(error => console.error(error));
      }
    },
    filterListByModelName(e) {
      console.log(e.target.value);
    },
  }
});