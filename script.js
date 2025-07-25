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

    function handleStart(e) {
        e.preventDefault();
        const target = e.target === hourHand || e.target === minuteHand ? e.target : null;
        if (!target) return;
        
        document.body.style.cursor = 'grabbing';
        
        const moveHandler = (moveEvent) => {
            const clientX = moveEvent.clientX || (moveEvent.touches && moveEvent.touches[0].clientX);
            const clientY = moveEvent.clientY || (moveEvent.touches && moveEvent.touches[0].clientY);
            
            if (clientX && clientY) {
                const moveEventWithCoords = new MouseEvent('mousemove', {
                    clientX,
                    clientY,
                    bubbles: true,
                    cancelable: true
                });
                handleMouseMove(moveEventWithCoords, target.id);
            }
        };
        
        const endHandler = () => {
            document.body.style.cursor = 'default';
            document.removeEventListener('mousemove', moveHandler);
            document.removeEventListener('touchmove', moveHandler);
            document.removeEventListener('mouseup', endHandler);
            document.removeEventListener('touchend', endHandler);
        };
        
        document.addEventListener('mousemove', moveHandler);
        document.addEventListener('touchmove', moveHandler, { passive: false });
        document.addEventListener('mouseup', endHandler, { once: true });
        document.addEventListener('touchend', endHandler, { once: true });
        
        // Trigger initial move to update position immediately
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);
        
        if (clientX && clientY) {
            const initialMove = new MouseEvent('mousemove', {
                clientX,
                clientY,
                bubbles: true,
                cancelable: true
            });
            handleMouseMove(initialMove, target.id);
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

    // Function to check if touch is near a clock hand
    function isTouchNearHand(touchX, touchY, hand) {
        const rect = hand.getBoundingClientRect();
        const handX = rect.left + rect.width / 2;
        const handY = rect.top + rect.height / 2;
        const distance = Math.sqrt(
            Math.pow(touchX - handX, 2) + 
            Math.pow(touchY - handY, 2)
        );
        // Consider touch within 50px of the hand as valid
        return distance < 50;
    }

    // Add mouse and touch event listeners
    clockFace.addEventListener('mousedown', handleStart);
    
    // Enhanced touch event handling with better touch detection
    clockFace.addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        const touchX = touch.clientX;
        const touchY = touch.clientY;
        
        // Check which hand is being touched
        if (isTouchNearHand(touchX, touchY, hourHand)) {
            e.preventDefault();
            handleStart(e);
        } else if (isTouchNearHand(touchX, touchY, minuteHand)) {
            e.preventDefault();
            handleStart(e);
        }
    }, { passive: false });
    
    // Prevent any touchmove on the document while dragging
    document.addEventListener('touchmove', (e) => {
        // Only prevent default if we're actually dragging a hand
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            const touchX = touch.clientX;
            const touchY = touch.clientY;
            
            if (isTouchNearHand(touchX, touchY, hourHand) || 
                isTouchNearHand(touchX, touchY, minuteHand)) {
                e.preventDefault();
            }
        }
    }, { passive: false });
    
    // Prevent context menu on long press
    clockFace.addEventListener('contextmenu', (e) => {
        if (e.target === hourHand || e.target === minuteHand) {
            e.preventDefault();
        }
    });
    
    // Add visual feedback on touch
    function addTouchFeedback(hand) {
        hand.style.opacity = '0.4';
        hand.style.transition = 'opacity 0.2s';
    }
    
    function removeTouchFeedback(hand) {
        hand.style.opacity = '0.2';
    }
    
    // Add touch feedback
    clockFace.addEventListener('touchstart', (e) => {
        if (e.target === hourHand || e.target === minuteHand) {
            addTouchFeedback(e.target);
        }
    }, { passive: true });
    
    document.addEventListener('touchend', (e) => {
        removeTouchFeedback(hourHand);
        removeTouchFeedback(minuteHand);
    }, { passive: true });

    setInitialTime();
});
