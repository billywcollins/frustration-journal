//feather icons
feather.replace();

// dismiss the alert when you've added an entry
window.onload = () => {
	const alert = document.getElementById('messages');
	if(alert) {
		setTimeout(function() {
			alert.style.display='none'
		}, 3000)
	}

	// const form = document.getElementById('addEntryForm');
	// if(form) {
	// 	var categoryEntry = document.getElementById('category-select');
	// 	var 
	// }
}

// change nav background color to white
window.onscroll = () => {
  const nav = document.querySelector('#navbar');
  const classes = document.getElementById('navbar').className;
  if(this.scrollY <= 100) {
  	nav.className = 'site-header fixed-top py-1';
  } else {
  	nav.className = 'site-header fixed-top py-1 scroll';
  }
};

//enable show/hide password functionality
function showMyPassword() {
	var x = document.getElementById('password')
	var y = document.getElementById('showPassword')
	console.log(y)
	if (x.type === 'password') {
		x.type = 'text'
		y.innerHTML = 'Hide'
	} else {
		x.type = 'password'
		y.innerHTML = 'Show'
	}
}

//show modal with errors

function showSomeModal() {
	document.getElementById('addEntry').modal('show')
}

$(document).ready(function(){
	// $("#showSomeModal").click(function(){
	// 	$("#entryModal").modal();
	// });

	$("#addEntryForm").submit(function(e) {
		// get the form data
		var formData = {
			'title': $('input[name=title]').val(),
			'location': $('input[name=location]').val(),
			'description': $('textarea[name=description]').val(),
			'idea': $('textarea[name=idea]').val(),
			'category': $('select[name=category]').val(),
			'size': $('select[name=size]').val(),
		};

		// process the form

		$.ajax({
			type: 'POST',
			url: '/',
			data: formData,
			dataType: 'json',
			encode: true
		}).done(function(data) {
			console.log(data);
			console.log('is this even getting logged')
			if (data.errors) {
				alert('There was an error');
				for(error in errors) {
					if(error.param == 'category')
						console.log('there was a category error')
						$('#category').append('<div class="small text-danger">' + error.msg + '</div>');
				}
			} else {
				alert('Good submission');
				window.location = '/journal';
			}
		});

		e.preventDefault();

	})
});
