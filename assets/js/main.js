NoBitcoinLicense = (function($) {
	var smartyStreetsProxy = 'https://act.eff.org/smarty_streets/street_address/';
	var callPowerCreate = 'https://call.eff.org/call/create';
	var callPowerCampaignId = 2;

	var callForm = $('form.call-form');
	var addressField = $('input[name=address1]');
	var zipcodeField = $('input[name=zipcode]');
	var phoneField = $('input[name=phone]');
	var lat, lon, phone = null;

	validateAddress = function() {
		var isValid = /[\d\w\s]+/.test(addressField.val());
		addressField.parent('.form-group').toggleClass('has-error', !isValid);
		return isValid;
	};

	validateZipcode = function() {
		var isValid = /(\d{5}([\-]\d{4})?)/.test(zipcodeField.val());
		zipcodeField.parent('.form-group').toggleClass('has-error', !isValid);
		return isValid;
	};

	validatePhone = function() {
		var phoneValDigitsOnly = phoneField.val().match(/\d/g);
		var isValid = phoneValDigitsOnly && (phoneValDigitsOnly.length === 10);
		// just check for 10 digits, don't try to validate number
		phoneField.parent('.form-group')
			.toggleClass('has-error', !isValid)
			.toggleClass('has-success', isValid);
		phone = phoneValDigitsOnly.join('');
		return isValid;
	};

	lookupAddress = function() {
		zipcodeField.parent('.form-group').addClass('has-feedback');
		if (!(validateZipcode() && validateAddress())) {
			return false;
		}

		$.ajax(smartyStreetsProxy, {
			method: 'GET',
			data: {
				street: addressField.val(),
				zipcode: zipcodeField.val()
			},
			success: function(data) {
				var gotLatLon = false;
				if (data[0].metadata) {
					lat = data[0].metadata.latitude;
					lon = data[0].metadata.longitude;
					gotLatLon = true;
				}
				zipcodeField.parent('.form-group')
					.toggleClass('has-error', !gotLatLon)
					.toggleClass('has-success', gotLatLon);
			},
			error: function(xhr, status, error) {
				console.error(error);
				zipcodeField.parent('.form-group')
					.addClass('has-error')
					.removeClass('has-success');
			}
		});
	};

	getLatLon = function() {
		if (lat && lon) {
			return [lat, lon];
		}
	};

	getPhone = function() {
		return phone;
	};

	makeCall = function(event) {
		if (event) {
			event.preventDefault();
		}
		
		console.log('form submit');
		if (!(validateAddress() && validateZipcode() && validatePhone())) {
			console.err('form invalid');
			return false;
		}

		$.ajax(callPowerCreate, {
			method: 'GET',
			data: {
				campaignId: callPowerCampaignId,
				userLocation: getLatLon().toString(),
				userPhone: getPhone(),
				userCountry: 'US'
			},
			success: function(data) {
				alert('calling now!');
				// TODO
				// show modal overlay?
				// share links?
			},
			error: function(xhr, status, error){
				console.error(error);
			}
		});
	};

	return {
		init: function() {
			addressField.blur(validateAddress);
			zipcodeField.blur(lookupAddress);
			phoneField.blur(validatePhone);
			callForm.submit(makeCall);
		}
	};
})(jQuery);

$(document).ready(function() {
	app = NoBitcoinLicense;
	app.init();
});
