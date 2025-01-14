// const developmentBaseUrl = 'http://localhost:3000/';
const productionBaseUrl = 'https://divvy-app.herokuapp.com/';

// const baseUrl = developmentBaseUrl;
const baseUrl = productionBaseUrl;

$(document).ready(function () {
  $('#addbillcard').hide();
  $('#viewbills').hide();


  // Opening modal
  var modal = document.getElementById('myModal');
  // Add Payer modal
  var modal2 = document.getElementById('modal2');
  // Add Payer modal
  var billDetailModal = document.getElementById('billDetailModal');
  // Get the button that opens the opening modal
  var openingModalBtn = document.getElementById('myBtn');
  // Get the <span> element that closes the modal
  var span = document.getElementsByClassName('close')[1];

  // jQuery button elements
  const signUpElem = $('#signupbutton');
  const signInElem = $('#signinbutton');
  const submitBillElem = $('#addbillsubmit');
  const searchUserByEmailElem = $('#addUserEmail');
  const addUsersToBillElem = $('#addemails');


  // ***************************************
  // Local Storage functions
  // ***************************************

  function deleteAuthState() {
    localStorage.removeItem('authState');
  }

  function createAuthState(firstName, lastName, email) {
    deleteAuthState();
    $('.username').text('');
    const authState = {
      firstName: firstName,
      lastName: lastName,
      email: email,
    };

    localStorage.setItem('authState', JSON.stringify(authState));
  }

  function getAuthState() {
    return JSON.parse(localStorage.getItem('authState'));
  }

  // ***************************************
  // Ajax functions
  // ***************************************

  function alertModal(title, body) {
    // Display error message to the user in a modal
    $('#alert-modal-title').html(title);
    $('#alert-modal-body').html(body);
    $('#alert-modal').show();
  }

  // Sign in
  function signIn(userData, callback) {
    const queryUrl = baseUrl + 'api/auth/';
    $.ajax({
      url: queryUrl,
      method: 'POST',
      data: {
        email: userData.email,
        password: userData.password,
      },
    }).then(response => {
      callback(response);
    });
  }

  // Create new user
  function createUser(userData, callback) {
    const createUserApiUrl = baseUrl + 'api/users/';
    const newUser = {
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      phoneNumber: userData.phoneNumber,
      password: userData.password,
    };

    $.ajax({
      url: createUserApiUrl,
      method: 'POST',
      data: newUser,
    }).then(response => {
      userData.amountYouOwe;

      callback(response);
    });
  }

  // Constructs a bill row in the dashboard bills table
  function buildBillViewRow(bill, destination) {
    const tableRow = $('<tr>').attr('data-id', bill.id).addClass('bill-list-item');
    const tableHead = $('<th>').attr('scope', 'row').text(bill.id);
    const titleCell = $('<td>').text(bill.title);
    const companyCell = $('<td>').text(bill.Company);
    const amountCell = $('<td>').text(bill.Amount);
    const isPaidCell = $('<td>').text(bill.BillPaid);
    const youOweCell = $('<td>').text(bill.UserBill.amountOwed);
    const addPayersBtn = $('<button type="button" class="btn btn-outline-light addPayers">Add payers</button>');
    const billDetailBtn = $('<button type="button" class="btn btn-outline-light viewBill">View Bill</button>');
    const settle = $('<a class="btn btn-outline-light settle" role="button" href="https://venmo.com/" target="_blank">Pay bill</a>');
    tableRow
      .append(tableHead, titleCell, companyCell, amountCell, youOweCell, isPaidCell, addPayersBtn, billDetailBtn, settle);
    destination.append(tableRow);
  }

  //function get all users associated will bill
  function getBillsForUser(userEmail) {
    var queryURL = baseUrl + 'api/users/bills/';
    $.ajax({
      url: queryURL + userEmail,
      method: 'GET',
    }).then(function (response) {
      response.forEach(bill => {
        buildBillViewRow(bill, $('#current-bills'));
      });
    });
  }

  // Associate a bill with a user
  function addBillToUser(userAndBillData, callback) {
    const apiUrl = baseUrl + 'api/users/addbill/';

    $.ajax({
      url: apiUrl,
      method: 'POST',
      data: {
        'email': userAndBillData.email,
        'billId': userAndBillData.billId,
        'amountOwed': userAndBillData.amountOwed
      }
    }).then(() => {
      callback();
    });
  }

  // Adds a table row in adding a user to a bill modal
  function buildAddUserToBillTableRow(user, payerClass) {
    const userDiv = $('<div>').addClass(payerClass);
    const firstNameElem = $('<tr><td>' + 'First name: ' + user.firstName + '</tr></td>').attr('firstName', user.firstName);
    const lastNameElem = $('<tr><td>' + 'Last name: ' + user.lastName + '</tr></td>').attr('last-name', user.lastName);
    const userEmailElem = $('<tr><td>' + 'Email: ' + user.email + '</tr></td>').attr('email', user.email);
    let amountOwedElem;
    if (user.amountOwed) {
      amountOwedElem = $('<tr><td>' + 'Amount owed: $' + user.amountOwed + '</tr></td>').attr('amountOwed', user.amountOwed);
    } else {
      amountOwedElem = $('');
    }
    var line = $('<div>').append('<hr>');

    userDiv.append(firstNameElem, lastNameElem, userEmailElem, amountOwedElem, line);

    $('#emails > tbody').append(userDiv);
  }

  //function create a bill and submit to DB
  function createBill(billData) {
    var queryURL = baseUrl + 'api/bills/';
    $.ajax({
      url: queryURL,
      method: 'POST',
      data: {
        title: billData.title,
        Company: billData.Company,
        Amount: billData.Amount,
        BillDue: billData.BillDue,
        BillPaid: billData.BillPaid,
      }
    })
      .then(function (response) {
        if (response.id) { // bill creation success
          billId = response.id;
          const amountYouOwe = billData.amountYouOwe;
          const billCreator = getAuthState();

          const userData = {
            email: billCreator.email,
            billId: billId,
            amountOwed: amountYouOwe,
          };

          addBillToUser(userData, function () { // add bill creator to bill
            addUsersToBillElem.attr('data-id', billId);
            $('.add-payer-user').remove();
            $('.bill-creater').remove();

            buildAddUserToBillTableRow(billCreator, 'bill-creater');

            // Get all bills for user
            $('.bill-list-item').remove();
            getBillsForUser(billCreator.email);

            $('#modal2').show();
          });
        }
      });
  }

  // Constructs a user row in the bill detail view modal table
  function buildRowsBillDetail(payers) {
    $('.bill-payer-detail').remove();

    payers.forEach(payer => {
      const payerDiv = $('<div>').addClass('bill-payer-detail');
      const firstNameElem = $('<tr><td>' + 'First name: ' + payer.firstName + '</tr></td>');
      const lastNameElem = $('<tr><td>' + 'Last name: ' + payer.lastName + '</tr></td>');
      const userEmailElem = $('<tr><td>' + 'Email: ' + payer.email + '</tr></td>');
      const amountPayerOwesElem = $('<tr><td>' + 'Amount owed: $' + payer.UserBill.amountOwed + '</tr></td>');
      var line = $('<div>').append('<hr>');
      payerDiv.append(firstNameElem, lastNameElem, userEmailElem, amountPayerOwesElem, line);

      $('#viewBill').append(payerDiv);
    });
  }

  // Get details for a single bill by bill id
  function billDetail(billId, callback) {
    var queryURL = baseUrl + 'api/bills/';
    $.ajax({
      url: queryURL + billId,
      method: 'GET',
    }).then(response => {
      callback(response);
    });
  }

  // Get user by email
  function getUserByEmail(userData) {
    const getUserapiUrl = baseUrl + 'api/users/email/';

    $.ajax({
      url: getUserapiUrl + userData.email,
      method: 'GET',
    }).then(response => {
      if (response.length) { // Success. User found
        const user = response[0];
        user.amountOwed = userData.amountOwed;

        buildAddUserToBillTableRow(user, 'add-payer-user');
      } else {
        alert('Email address not found. Please have user make an account.');
        console.log('User email does not exist');
      }
    });
  }

  // Saves user authentication and scrolls page down to create bill section
  function directUserAfterAuth(response) {
    if (response.id) { // user found
      createAuthState(response.firstName, response.lastName, response.email);
      getBillsForUser(response.email);
      $('.username').append(response.firstName + '.');

      modal.style.display = 'none';
      $('#addbillcard').show();
      $('#viewbills').show();
      $('html, body').animate({
        scrollTop: ($('#addbillcard').offset().top)
      }, 200);
    } else {
      alert('Please enter a valid email address OR make an account.');
    }
  }

  // ***************************************
  // Onclick handler functions
  // ***************************************

  // When the user clicks on the button, open the modal
  openingModalBtn.onclick = function () {
    modal.style.display = 'block';
    $('#signupform').hide();
    $('#signinform').hide();
  };

  // Closes modal
  span.onclick = function () {
    modal2.style.display = 'none';
    billDetailModal.style.display = 'none';
  };

  // Close alert modal
  $('#close-alert-modal').click(function(event) {
    event.preventDefault();
    $('#alert-modal').hide();
  });

  // Handle sign in on click
  signInElem.click(function (event) {
    event.preventDefault();
    const userData = {
      email: $('#signinemail').val().trim(),
      password: $('#signinpassword').val().trim()
    };
    signIn(userData, directUserAfterAuth);
  });

  // Handle create user on click
  signUpElem.click(function () {
    event.preventDefault();

    const userData = {
      firstName: $('#signupfirstname').val().trim(),
      lastName: $('#signuplastname').val().trim(),
      email: $('#signupemail').val().trim(),
      phoneNumber: $('#signupphone').val().trim(),
      password: $('#signuppassword').val().trim()
    };
    createUser(userData, directUserAfterAuth);
  });

  // Handle submit bill on click
  submitBillElem.click(function () {
    const billData = {
      title: $('#inputbill').val().trim(),
      Company: $('#inputcompany').val().trim(),
      Amount: $('#inputprice').val().trim(),
      // BillDue: $('#dueDate').val(),
      BillPaid: $('.paid:checked').val(),
      amountYouOwe: $('#price-you-owe').val(),
    };

    //if amount you owe > amount throw error
    if (billData.Amount < billData.amountYouOwe) {
      alertModal('Error.', 'Bill total must be less than amount owed.');
      return;
    }

    createBill(billData);
    $('#inputbill').val('');
    $('#inputcompany').val('');
    $('#inputprice').val('');
    $('.paid:checked').val('');
    $('#price-you-owe').val('');
  });

  // Handle search for user email
  searchUserByEmailElem.click(function () {
    const userData = {
      email: $('#inputemail').val(),
      amountOwed: $('#amount-user-owes').val(),
    };
    getUserByEmail(userData);
    $('#inputemail').val('');
    $('#amount-user-owes').val('');
  });

  // Binds the 'add payers' button for each bill in dashboard
  $(document).on('click', '.addPayers', function (event) {
    event.preventDefault();
    var billId = $(this).parent().attr('data-id');
    $('.add-payer-user').remove();
    $('.bill-creater').remove();
    addUsersToBillElem.attr('data-id', billId);

    const user = getAuthState();
    buildAddUserToBillTableRow(user, 'bill-creater');

    $('#modal2').show();
  });

  // Binds the 'view bill' button for each bill in dashboard
  $(document).on('click', '.viewBill', function (event) {
    event.preventDefault();
    var billId = $(this).parent().attr('data-id');
    $('#billDetailModal').show();
    billDetail(billId, function (response) {
      buildRowsBillDetail(response);
    });
  });

  // Handle add users to bill click
  addUsersToBillElem.click(function () {
    $('.add-payer-user').each((index, value) => {
      const email = $(value).find('[email]').attr('email');
      const amountOwed = $(value).find('[amountOwed]').attr('amountOwed');
      const billId = $(this).attr('data-id');
      const dataToSend = {
        email: email,
        amountOwed: amountOwed,
        billId: billId
      };
      addBillToUser(dataToSend, function () {
        $('#modal2').hide();
      });
    });
  });

  // STILL WORKING ON THIS -RAMON //
  // $("#settleBill").on("click", function(){
  //   location.replace("https://venmo.com/");
  //  });
  // $('#settleBill').click(function(){
  //   console.log('hi');
  //   location.replace('https://venmo.com/');
  // });
  // $('#settleBill').on('click', '.link', function() {
  //   $("#link").append('<a href="#" class="link"> Link </a>');
  // });

  // $('#settleBill').html('<a href="#" class="link">Link</a>');



  // On click function to exit out of #myModal
  $('#myModalExit').on('click', function () {
    $('#myModal').remove();
    location.reload();
  });

  $('.closeBillDetails').click(function () {
    $('#billDetailModal').hide();
  });

});
