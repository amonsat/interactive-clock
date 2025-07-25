document.addEventListener('DOMContentLoaded', () => {
    const hourHand = document.getElementById('hourHand');
    const minuteHand = document.getElementById('minuteHand');
    const digitalTime = document.getElementById('digitalTime');
    const clockFace = document.querySelector('.clock-face');
    const formatToggle = document.getElementById('formatToggle');

    let is24HourFormat = false;
    let hours = 0;
    let minutes = 0;
    let lastAngle = 0;

    function setInitialTime() {
        const now = new Date();
        hours = now.getHours();
        minutes = now.getMinutes();
        updateClock(hours, minutes);
    }

    function updateClock(h, m) {
        hours = (h + 24) % 24;
        minutes = (m + 60) % 60;

        const minuteAngle = minutes * 6;
        const hourAngle = (hours % 12) * 30 + minutes * 0.5;

        minuteHand.style.transform = `rotate(${minuteAngle}deg)`;
        hourHand.style.transform = `rotate(${hourAngle}deg)`;

        updateDigitalTime();
    }

    function updateDigitalTime() {
        let displayHours = hours;
        let period = '';

        if (!is24HourFormat) {
            period = hours >= 12 ? ' PM' : ' AM';
            displayHours = hours % 12;
            if (displayHours === 0) {
                displayHours = 12;
            }
        }

        const formattedMinutes = minutes.toString().padStart(2, '0');
        const formattedHours = displayHours.toString().padStart(2, '0');

        digitalTime.textContent = is24HourFormat ? `${formattedHours}:${formattedMinutes}` : `${displayHours}:${formattedMinutes}${period}`;
    }

    function handleMouseDown(e) {
        if (e.target === hourHand || e.target === minuteHand) {
            document.body.style.cursor = 'grabbing';
            const handler = (moveEvent) => handleMouseMove(moveEvent, e.target.id);
            document.addEventListener('mousemove', handler);
            document.addEventListener('mouseup', () => {
                document.body.style.cursor = 'default';
                document.removeEventListener('mousemove', handler);
            }, { once: true });
        }
    }

    function handleMouseMove(e, draggedHand) {
        const rect = clockFace.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const dx = e.clientX - centerX;
        const dy = e.clientY - centerY;

        let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
        if (angle < 0) angle += 360;

        if (draggedHand === 'minuteHand') {
            // Detect crossing the 12 o'clock position
            if (Math.abs(angle - lastAngle) > 180) {
                if (angle > lastAngle) {
                    hours--; // Moved counter-clockwise
                } else {
                    hours++; // Moved clockwise
                }
            }
            const newMinutes = Math.round(angle / 6);
            updateClock(hours, newMinutes);
        } else if (draggedHand === 'hourHand') {
            const current12Hour = hours % 12;
            const newHour12 = Math.round(angle / 30);

            // Detect crossing the 12 o'clock position for the hour hand
            if (current12Hour === 11 && newHour12 === 0) {
                hours++; // from 11 to 12
            } else if (current12Hour === 0 && newHour12 === 11) {
                hours--; // from 12 to 11
            }

            const newHours = Math.floor(hours / 12) * 12 + newHour12;
            updateClock(newHours, minutes);
        }

        lastAngle = angle;
    }

    formatToggle.addEventListener('change', () => {
        is24HourFormat = formatToggle.checked;
        updateDigitalTime();
    });

    clockFace.addEventListener('mousedown', handleMouseDown);

    setInitialTime();
});
