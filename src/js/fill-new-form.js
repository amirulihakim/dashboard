document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('newReportForm');

    form.addEventListener('submit', function(e) {
        e.preventDefault();

        // Gather form data
        const formData = {
            datetime: document.getElementById('datetime').value,
            activity: document.getElementById('activity').value,
            location: document.getElementById('location').value,
            PIC: document.getElementById('PIC').value,
            Description: document.getElementById('Description').value,
            status: document.getElementById('status').value
        };

        // Send POST request to server
        fetch('http://localhost:3000/api/daily-report', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Report submitted successfully!');
                window.location.href = 'daily-report.html'; // Redirect to daily report page
            } else {
                alert('Error submitting report: ' + (data.error || 'Unknown error'));
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error submitting report. Please try again.');
        });
    });

    // Set default datetime to current date and time
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    document.getElementById('datetime').value = now.toISOString().slice(0, 16);
});
