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
		var num = phoneField.val();
		// remove whitespace, parens
		num = num.replace(/\s/g, '').replace(/\(/g, '').replace(/\)/g, '');
		// plus, dashes
        num = num.replace("+", "").replace(/\-/g, '');
        // leading 1
        if (num.charAt(0) == "1")
            num = num.substr(1);
        var isValid = (num.length == 10); // ensure just 10 digits remain 
		phoneField.parent('.form-group')
			.toggleClass('has-error', !isValid)
			.toggleClass('has-success', isValid);
		if (isValid) {
			phone = num;
			phoneField.next('.form-control-feedback')
				.addClass('ion-checkmark')
				.removeClass('ion-close');

		} else {
			phoneField.next('.form-control-feedback')
				.removeClass('ion-checkmark')
				.addClass('ion-close');
		}
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
				var gotLatLon, gotDeliverableAddress = false;
				if (data[0].metadata) {
					lat = data[0].metadata.latitude;
					lon = data[0].metadata.longitude;
					gotLatLon = true;
				}
				if (data[0].analysis && data[0].analysis.dpv_match_code) {
					gotDeliverableAddress = true;
				}
				zipcodeField.parent('.form-group')
					.toggleClass('has-error', !gotLatLon)
					.toggleClass('has-success', gotLatLon);
				if (gotLatLon) {
					zipcodeField.next('.form-control-feedback')
						.addClass('ion-checkmark')
						.removeClass('ion-close');
				} else {
					zipcodeField.next('.form-control-feedback')
						.removeClass('ion-checkmark')
						.addClass('ion-close');
				}

				addressField.parent('.form-group')
					.toggleClass('has-error', !gotDeliverableAddress)
					.toggleClass('has-success', gotDeliverableAddress);
				if (gotDeliverableAddress) {
					addressField.next('.form-control-feedback')
						.addClass('ion-checkmark')
						.removeClass('ion-close');
				} else {
					addressField.next('.form-control-feedback')
						.removeClass('ion-checkmark')
						.addClass('ion-close');
				}

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
		},
		getLatLon: getLatLon
	};
})(jQuery);

$(document).ready(function() {
	app = NoBitcoinLicense;
	app.init();
});
