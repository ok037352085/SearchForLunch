let map;
let currentPos;
let selectedRestaurant;
let marker;
let directionsService;
let directionsRenderer;
let infoWindow;

function initMap() {
    map = new google.maps.Map(document.getElementById('map'),{
        center: {lat: 23.553118, lng: 121.0211024}, //地圖中心位置
        zoom: 8, //預設大小
    });

    navigator.geolocation.getCurrentPosition(function(position)
    {
        currentPos = {lat: position.coords.latitude,lng: position.coords.longitude,};

        map.setCenter(currentPos);
        map.setZoom(16);

        const autocomplete = new google.maps.places.Autocomplete(
            document.getElementById('search-input'),
            {
                types: ['restaurant'],
                bounds: {
                    east: currentPos.lng + 0.001,
                    west: currentPos.lng - 0.001,
                    south: currentPos.lat - 0.001,
                    north: currentPos.lat + 0.001,
                },
                strictBounds: false,
            }
        );

        autocomplete.addListener('place_changed', function(){
            const place = autocomplete.getPlace()

            selectedRestaurant ={
                location: place.geometry.location,
                placeId: place.place_id,
                name: place.name,
                address: place.formatted_address,
                phomeNumber: place.formatted_phone_number,
                rating: place.rating,
            };
            map.setCenter(selectedRestaurant.location);

            if(!marker)
            {
                marker = new google.maps.Marker({
                    map: map, //有圖,所以要指定地圖
                });
            }

            marker.setPosition(selectedRestaurant.location);

            if(!directionsService){
                directionsService = new google.maps.DirectionsService();
            }

            if(!directionsRenderer){
                directionsRenderer = new google.maps.DirectionsRenderer({
                    map: map, //有圖
                });
            }

            directionsRenderer.set('directions', null);

            directionsService.route({
                origin: new google.maps.LatLng(
                    currentPos.lat,
                    currentPos.lng
                ),
                destination:{
                    placeId: selectedRestaurant.placeId,
                },
                travelMode:'WALKING',
            },
            function(response, status) {
                if(status === 'OK'){
                    directionsRenderer.setDirections(response);

                    if(!infoWindow)
                    {
                        infoWindow = new google.maps.InfoWindow();
                    }

                    infoWindow.setContent(
                        `
                        <h3>${selectedRestaurant.name}</h3>
                        <div>地址:${selectedRestaurant.address}</div>
                        <div>電話:${selectedRestaurant.phomeNumber}</div>
                        <div>評分:${selectedRestaurant.rating}</div>
                        <div>步行時間:${response.routes[0].legs[0].duration.text}</div>
                        `
                    );
                    infoWindow.open(map,marker);
                }
            });
        });
    });
}

const restaurantList = JSON.parse(localStorage.getItem('restaurantList')) || [];
restaurantList.forEach(function(restaurant){ 
    document.getElementById('restaurant-list').innerHTML += `
    <li class="list-group-item">
        ${restaurant.name}
        <button class="btn-close float-end remove"></button>
    </li>
    `;
});

const colors = ['#eae56f','#89f26e','#7de6ef','#e7706f'];

let wheel = new Winwheel({
    canvasId: 'canvas',
    numSegments: restaurantList.length,
    segments: restaurantList.map((restaurant, index) =>{
        return{
            fillStyle: colors[index % 4],
            text: restaurant.name,
            strokeStyle: 'white',
        };
    }),
    pins: true,
    animation: {
        type: 'spinToStop',
        spins: 16,
        easing: 'Power4.easeInOut',
        callbackFinished: function(segment) {
            document.getElementById('wheel').style.display = 'none';
            wheel.rotationAngle = 0;
            wheel.draw();

            window.alert(segment.text)
            const restaurantList = 
            JSON.parse(localStorage.getItem('restaurantList')) || [];
            selectedRestaurant = restaurantList.find(function(restaurant){
                return restaurant.name === segment.text;
            });
            map.setCenter(selectedRestaurant.location);

            if(!marker)
            {
                marker = new google.maps.Marker({
                    map: map, //有圖,所以要指定地圖
                });
            }

            marker.setPosition(selectedRestaurant.location);

            if(!directionsService){
                directionsService = new google.maps.DirectionsService();
            }

            if(!directionsRenderer){
                directionsRenderer = new google.maps.DirectionsRenderer({
                    map: map, //有圖
                });
            }

            directionsRenderer.set('directions', null);

            directionsService.route({
                origin: new google.maps.LatLng(
                    currentPos.lat,
                    currentPos.lng
                ),
                destination:{
                    placeId: selectedRestaurant.placeId,
                },
                travelMode:'WALKING',
            },
            function(response, status) {
                if(status === 'OK'){
                    directionsRenderer.setDirections(response);

                    if(!infoWindow)
                    {
                        infoWindow = new google.maps.InfoWindow();
                    }

                    infoWindow.setContent(
                        `
                        <h3>${selectedRestaurant.name}</h3>
                        <div>地址:${selectedRestaurant.address}</div>
                        <div>電話:${selectedRestaurant.phomeNumber}</div>
                        <div>評分:${selectedRestaurant.rating}</div>
                        <div>步行時間:${response.routes[0].legs[0].duration.text}</div>
                        `
                    );
                    infoWindow.open(map,marker);
                }
            });
        },
    },
});

document.getElementById('draw').addEventListener('click',function(){
    document.getElementById('wheel').style.display='block';
    wheel.startAnimation();
})

document.getElementById('addBtn').addEventListener('click', function(){
    document.getElementById('restaurant-list').innerHTML += `
    <li class="list-group-item">
        ${selectedRestaurant.name}
        <button class="btn-close float-end remove"></button>
    </li>
    `;
    const restaurantList = JSON.parse(localStorage.getItem('restaurantList')) || [];

    const color = colors[restaurantList.length % 4]
    wheel.addSegment({
        fillStyle: color,
        text: selectedRestaurant.name,
        strokeStyle: 'white',
    });

    restaurantList.push(selectedRestaurant);
    localStorage.setItem('restaurantList', JSON.stringify(restaurantList));

});

document.getElementById('restaurant-list').addEventListener('click', function(e){
    if(e.target.classList.contains('remove')) {
        e.target.parentNode.remove();

        const restaurantName = e.target.parentNode.innerText.trim(); 

        const restaurantList = JSON.parse(localStorage.getItem('restaurantList')) || [];

        const index = restaurantList.findIndex(function(restaurant){

            return restaurant.name === restaurantName;
        });
        wheel.deleteSegment(index + 1)
        wheel.draw();

        const newRestaurantList = restaurantList.filter(function(restaurant){
            if(restaurant.name === restaurantName) return false;
            return true;
        });
        localStorage.setItem('restaurantList', JSON.stringify(newRestaurantList));
    }
});