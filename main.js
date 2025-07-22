document.getElementById('bookingForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  
  // Try these options one by one if you get 404:
const urlsToTry = [
  'send-email.php',          // Same directory
  './send-email.php',        // Same directory (explicit)
  '/send-email.php',         // Root directory
  '../send-email.php',       // Parent directory
  'scripts/send-email.php',  // If in scripts subfolder
];

let lastError = null;

for (const url of urlsToTry) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    
    if (response.ok) break; // Success!
    
    lastError = `Failed with ${url}: ${response.status}`;
  } catch (e) {
    lastError = e.message;
  }
}

if (!response.ok) {
  throw new Error(`All URLs failed. Last error: ${lastError}`);
}
  
  
  // Show loading state
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalBtnText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = 'Sending...';
  
  try {
    const response = await fetch('send-email.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    // Check if we got a response at all
    if (!response) {
      throw new Error('No response from server');
    }

    // Check content type
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Non-JSON response:', text);
      throw new Error('Server returned unexpected format');
    }

    const data = await response.json();
    
    if (!data) {
      throw new Error('Empty response from server');
    }

    if (!data.success) {
      throw new Error(data.error || 'Request failed');
    }
    
    alert('Booking request sent successfully! We will contact you soon.');
    document.getElementById('bookingForm').reset();
    
  } catch (error) {
    console.error('Full error:', error);
    
    let errorMessage = 'Error sending booking request: ';
    
    if (error.message.includes('Unexpected end of JSON input')) {
      errorMessage += 'Server response was incomplete. Please try again.';
    } else {
      errorMessage += error.message;
    }
    
    alert(errorMessage);
    
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalBtnText;
  }
});
document.getElementById('bookingForm').addEventListener('submit', async function(e) {
  e.preventDefault();

  const form = e.target;
  const formData = {
    name: form.name.value,
    email: form.email.value,
    contact: form.contact.value,
    arrival: form.arrival.value,
    departure: form.departure.value,
    adults: form.adults.value,
    kids: form.kids.value,
    nationality: form.nationality.value
  };

  const submitBtn = form.querySelector('button[type="submit"]');
  const originalBtnText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = 'Sending...';

  try {
    const response = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    const result = await response.json();
    if (result.success) {
      alert('Booking submitted! We will contact you soon.');
      form.reset();
    } else {
      alert('Submission failed: ' + result.error);
    }
  } catch (error) {
    alert('Error: ' + error.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalBtnText;
  }
});

