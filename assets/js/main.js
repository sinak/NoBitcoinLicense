/*========================================
   Call tool
========================================*/

var CallForm = function (formSel) {
	this.callForm, this.addressField, this.zipcodeField, this.phoneField = null;
	this.lat, this.lon, this.phone = null;

  this.callForm = $(formSel);
	this.addressField = $(formSel+' input[name=address]');
	this.zipcodeField = $(formSel+' input[name=zipcode]');
	this.phoneField = $(formSel+' input[name=phone]');
	this.reset = $(formSel).siblings('.post-submit').find('.tryagain');

	this.addressField.on("blur", $.proxy(this.validateAddress, this));
	this.zipcodeField.on("blur", $.proxy(this.lookupAddress, this));
	this.phoneField.on("blur", $.proxy(this.validatePhone, this));
	this.reset.on("click", $.proxy(this.resetForm, this));
	this.callForm.on("submit", {self: this}, $.proxy(this.makeCall, this));
};

CallForm.prototype = function() {
	var smartyStreetsProxy = 'https://act.eff.org/smarty_streets/street_address/';
	var callPowerCreate = 'https://call.eff.org/call/create';
	var callPowerCampaignId = 2;

	var validateAddress = function() {
		var isValid = /[\d\w\s]+/.test(this.addressField.val());
		this.addressField.parent('.form-group').toggleClass('has-error', !isValid);
		return isValid;
	};

	var validateZipcode = function() {
		var isValid = /(\d{5}([\-]\d{4})?)/.test(this.zipcodeField.val());
		this.zipcodeField.parent('.form-group').toggleClass('has-error', !isValid);
		return isValid;
	};

	var validatePhone = function() {
		var num = this.phoneField.val();
		// remove whitespace, parens
		num = num.replace(/\s/g, '').replace(/\(/g, '').replace(/\)/g, '');
		// plus, dashes
        num = num.replace("+", "").replace(/\-/g, '');
        // leading 1
        if (num.charAt(0) == "1")
            num = num.substr(1);
        var isValid = (num.length == 10); // ensure just 10 digits remain 
		this.phoneField.parent('.form-group')
			.toggleClass('has-error', !isValid)
			.toggleClass('has-success', isValid);
		if (isValid) {
			this.phone = num;
			this.phoneField.next('.form-control-feedback')
				.addClass('ion-checkmark')
				.removeClass('ion-close');

		} else {
			this.phoneField.next('.form-control-feedback')
				.removeClass('ion-checkmark')
				.addClass('ion-close');
		}
		return isValid;
	};

	var lookupAddress = function() {
		if (!(this.validateZipcode() && this.validateAddress())) {
			return false;
		}

		var self = this;
		$.ajax(smartyStreetsProxy, {
			method: 'GET',
			data: {
				street: this.addressField.val(),
				zipcode: this.zipcodeField.val()
			},
			success: function(data) {
				var gotLatLon, gotDeliverableAddress = false;
				if (data[0].metadata) {
					self.lat = data[0].metadata.latitude;
					self.lon = data[0].metadata.longitude;
					gotLatLon = true;
				}
				if (data[0].analysis && data[0].analysis.dpv_match_code) {
					gotDeliverableAddress = true;
				}
				self.zipcodeField.parent('.form-group')
					.toggleClass('has-error', !gotLatLon)
					.toggleClass('has-success', gotLatLon);
				if (gotLatLon) {
					self.zipcodeField.next('.form-control-feedback')
						.addClass('ion-checkmark')
						.removeClass('ion-close');
				} else {
					self.zipcodeField.next('.form-control-feedback')
						.removeClass('ion-checkmark')
						.addClass('ion-close');
				}

				self.addressField.parent('.form-group')
					.toggleClass('has-error', !gotDeliverableAddress)
					.toggleClass('has-success', gotDeliverableAddress);
				if (gotDeliverableAddress) {
					self.addressField.next('.form-control-feedback')
						.addClass('ion-checkmark')
						.removeClass('ion-close');
				} else {
					self.addressField.next('.form-control-feedback')
						.removeClass('ion-checkmark')
						.addClass('ion-close');
				}

			},
			error: function(xhr, status, error) {
				console.error(error);
				self.zipcodeField.parent('.form-group')
					.addClass('has-error')
					.removeClass('has-success');
			}
		});
	};

	var getLatLon = function() {
		return [this.lat, this.lon].toString();
	};

	var getPhone = function() {
		return this.phone;
	};

	var makeCall = function(event) {
		var self = this;
		event.preventDefault();
		
		if (!(this.validateAddress() && this.validateZipcode() && this.validatePhone())) {
			console.err('form invalid');
			return false;
		}

		$.ajax(callPowerCreate, {
			method: 'GET',
			data: {
				campaignId: callPowerCampaignId,
				userLocation: this.getLatLon(),
				userPhone: this.getPhone(),
				userCountry: 'US'
			},
			success: function(data) {
				Abba('CTA above fold').complete();
				$(event.target).addClass('hidden');
				var postSubmit = $(event.target).siblings('.post-submit');
				postSubmit.toggleClass('hidden');
				postSubmit.children('.share').addClass('revealAfter20Seconds').removeClass('hidden');
			},
			error: function(xhr, status, error){
				console.error(error);
			}
		});
	};

	var resetForm = function(event) {
		console.log(event.target);
		$(event.target).parents('.post-submit').addClass('hidden');
		this.callForm.removeClass('hidden');
	};

	// public interface
	return {
		validateAddress: validateAddress,
		validateZipcode: validateZipcode,
		validatePhone: validatePhone,
		lookupAddress: lookupAddress,
		makeCall: makeCall,
		getLatLon: getLatLon,
		getPhone: getPhone,
		resetForm: resetForm
	};
} ();

$(document).ready(function() {

	// Initialize forms
	top_form = new CallForm('#call-form-top');
	bottom_form = new CallForm('#call-form-bottom');

	// Share counts
	var shareUrl = 'https://nobitcoinlicense.org' || window.location.href;
	$.ajax('https://act.eff.org/tools/social_buttons_count/?networks=facebook,twitter,googleplus&url=' + shareUrl, { success: function(res, err) {
        $.each(res, function(network, value) {
            var count = value;
            if (count / 10000 > 1) {
                count = Math.ceil(count / 1000) + 'k';
            }
            $('[data-network="' + network + '"]').attr('count', count);
        });
    }
	});

	// Share button popups
	$(".fblinkthis" ).click(function() {
		var url = $(this).attr("href");
		window.open(url, "Share on Facebook", "width=650,height=500");
		return false;
	});
	$( ".twlinkthis" ).click(function() {
		var url = $(this).attr("href");
		window.open(url,"Twitter","width=550,height=420");
		return false;
	});
	$( ".gpluslinkthis" ).click(function() {
		var url = $(this).attr("href");
		window.open(url,"Share on Google Plus","width=500,height=436");
		return false;
	});
});


