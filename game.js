// Main Game Engine
class SinkGame {
    constructor(canvas, config) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.config = config;
        this.graphics = new GraphicsRenderer(this.ctx, config);

        // Game state
        this.gameState = {
            currentLevel: 1,
            score: 0,
            waterUsed: 0,
            totalWaterUsed: 0,
            itemsRemaining: 0,
            foodBodies: [],
            waterBodies: [],
            mouseX: 0,
            mouseY: 0,
            isMouseDown: false,
            isPaused: false,
            isWon: false,
            isGameOver: false,
            showingLevelBanner: false,
            bannerNeedsRelease: false,
            yellowAlertPlayed: false,
            redAlertPlayed: false
        };

        // Physics engine
        this.engine = Matter.Engine.create({
            gravity: { x: config.PHYSICS.GRAVITY_X, y: config.PHYSICS.GRAVITY_Y }
        });
        this.world = this.engine.world;

        // Timers
        this.lastDropTime = 0;
        this.lastPhysicsUpdate = 0;

        // Audio context for sound effects
        this.audioContext = null;
        this.initAudio();

        // Rendering scale (canvas size / base size)
        this.renderScale = this.canvas.width / config.CANVAS_WIDTH;

        // Setup
        this.setupSinkWalls();
        this.setupInputHandlers();
        this.startLevel(1);
        this.animate();

        // Make game instance globally accessible for resize events
        window.game = this;
    }

    // Handle canvas resize
    handleResize(newSize) {
        this.renderScale = newSize / this.config.CANVAS_WIDTH;
    }

    // Initialize audio context
    initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API not supported');
        }
    }

    // Play water drip sound
    playWaterDripSound() {
        if (!this.audioContext) return;

        const now = this.audioContext.currentTime;
        const duration = 0.03; // Very short, crisp drip (30ms)

        // Create noise buffer for splash effect
        const bufferSize = this.audioContext.sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = buffer.getChannelData(0);

        // Generate white noise
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }

        // Create and configure nodes
        const noiseSource = this.audioContext.createBufferSource();
        const filter = this.audioContext.createBiquadFilter();
        const gainNode = this.audioContext.createGain();

        noiseSource.buffer = buffer;
        noiseSource.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        // High-pass filter for splashy water sound
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(2000, now); // High frequencies for splash

        // Quick volume envelope (short, punchy drip)
        gainNode.gain.setValueAtTime(0.08, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);

        noiseSource.start(now);
        noiseSource.stop(now + duration);
    }

    // Play plop sound when item enters drain
    playPlopSound() {
        if (!this.audioContext) return;

        const now = this.audioContext.currentTime;
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        // Low plop sound
        oscillator.frequency.setValueAtTime(150, now);
        oscillator.frequency.exponentialRampToValueAtTime(50, now + 0.15);

        // Volume envelope for plop
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

        oscillator.start(now);
        oscillator.stop(now + 0.2);
    }

    // Play yellow warning alert (80% water usage)
    playYellowAlert() {
        if (!this.audioContext) return;

        const now = this.audioContext.currentTime;
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        // Medium-pitched warning beep
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(600, now);

        // Two short beeps
        gainNode.gain.setValueAtTime(0.15, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        gainNode.gain.setValueAtTime(0.15, now + 0.15);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

        oscillator.start(now);
        oscillator.stop(now + 0.25);
    }

    // Play red danger alert (100%+ water usage)
    playRedAlert() {
        if (!this.audioContext) return;

        const now = this.audioContext.currentTime;
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        // Higher-pitched urgent alarm
        oscillator.type = 'square'; // harsher sound
        oscillator.frequency.setValueAtTime(800, now);
        oscillator.frequency.setValueAtTime(700, now + 0.1);
        oscillator.frequency.setValueAtTime(800, now + 0.2);

        // Three urgent beeps
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        gainNode.gain.setValueAtTime(0.2, now + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
        gainNode.gain.setValueAtTime(0.2, now + 0.2);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.28);

        oscillator.start(now);
        oscillator.stop(now + 0.3);
    }

    // Create invisible walls around the sink (square shape)
    setupSinkWalls() {
        const sink = this.config.SINK;
        const halfWidth = sink.WIDTH / 2;
        const halfHeight = sink.HEIGHT / 2;
        const left = sink.CENTER_X - halfWidth;
        const right = sink.CENTER_X + halfWidth;
        const top = sink.CENTER_Y - halfHeight;
        const bottom = sink.CENTER_Y + halfHeight;
        const wallThick = sink.WALL_THICKNESS;

        const walls = [];

        // Top wall
        walls.push(Matter.Bodies.rectangle(
            sink.CENTER_X, top,
            sink.WIDTH, wallThick,
            {
                isStatic: true,
                restitution: this.config.WATER.WALL_RESTITUTION,
                friction: 0.1,
                label: 'wall'
            }
        ));

        // Bottom wall
        walls.push(Matter.Bodies.rectangle(
            sink.CENTER_X, bottom,
            sink.WIDTH, wallThick,
            {
                isStatic: true,
                restitution: this.config.WATER.WALL_RESTITUTION,
                friction: 0.1,
                label: 'wall'
            }
        ));

        // Left wall
        walls.push(Matter.Bodies.rectangle(
            left, sink.CENTER_Y,
            wallThick, sink.HEIGHT,
            {
                isStatic: true,
                restitution: this.config.WATER.WALL_RESTITUTION,
                friction: 0.1,
                label: 'wall'
            }
        ));

        // Right wall
        walls.push(Matter.Bodies.rectangle(
            right, sink.CENTER_Y,
            wallThick, sink.HEIGHT,
            {
                isStatic: true,
                restitution: this.config.WATER.WALL_RESTITUTION,
                friction: 0.1,
                label: 'wall'
            }
        ));

        Matter.World.add(this.world, walls);
    }

    // Setup mouse and touch input
    setupInputHandlers() {
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => {
            const x = e.offsetX / this.renderScale;
            const y = e.offsetY / this.renderScale;
            this.handlePointerDown(x, y);
        });

        this.canvas.addEventListener('mouseup', () => {
            this.handlePointerUp();
        });

        this.canvas.addEventListener('mousemove', (e) => {
            const x = e.offsetX / this.renderScale;
            const y = e.offsetY / this.renderScale;
            this.handlePointerMove(x, y);
        });

        this.canvas.addEventListener('mouseleave', () => {
            this.handlePointerUp();
        });

        // Touch events (mobile)
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            const touch = e.touches[0];
            const x = (touch.clientX - rect.left) / this.renderScale;
            const y = (touch.clientY - rect.top) / this.renderScale;
            this.handlePointerDown(x, y);
        });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.handlePointerUp();
        });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            const touch = e.touches[0];
            const x = (touch.clientX - rect.left) / this.renderScale;
            const y = (touch.clientY - rect.top) / this.renderScale;
            this.handlePointerMove(x, y);
        });

        // Click to dismiss banner or restart after game over
        this.canvas.addEventListener('click', () => {
            if (this.gameState.showingLevelBanner && !this.gameState.bannerNeedsRelease) {
                this.advanceFromBanner();
            } else if (this.gameState.isGameOver) {
                this.restartGame();
            }
        });
    }

    handlePointerDown(x, y) {
        this.gameState.isMouseDown = true;
        this.gameState.mouseX = x;
        this.gameState.mouseY = y;

        // Resume audio context on first user interaction (required by browsers)
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        // Clear banner release flag when NEW mousedown occurs during banner
        // This ensures only a completely NEW click (down+up) can dismiss the banner
        if (this.gameState.showingLevelBanner && this.gameState.bannerNeedsRelease) {
            this.gameState.bannerNeedsRelease = false;
        }
    }

    handlePointerUp() {
        this.gameState.isMouseDown = false;
    }

    handlePointerMove(x, y) {
        this.gameState.mouseX = x;
        this.gameState.mouseY = y;
    }

    // Start a level
    startLevel(levelNum) {
        // Clear existing bodies
        this.gameState.foodBodies.forEach(body => Matter.World.remove(this.world, body));
        this.gameState.waterBodies.forEach(body => Matter.World.remove(this.world, body));

        this.gameState.foodBodies = [];
        this.gameState.waterBodies = [];
        this.gameState.currentLevel = levelNum;
        this.gameState.waterUsed = 0;
        this.gameState.isWon = false;
        this.gameState.isPaused = false;
        this.gameState.showingLevelBanner = false;
        this.gameState.bannerNeedsRelease = false;
        this.gameState.isMouseDown = false; // Reset water spray
        this.gameState.yellowAlertPlayed = false; // Reset alert flags
        this.gameState.redAlertPlayed = false;

        const levelConfig = this.config.LEVELS[levelNum - 1];
        this.gameState.itemsRemaining = levelConfig.foodItems.length;

        // Spawn food items
        this.spawnFoodItems(levelConfig.foodItems);
    }

    // Spawn food items in the sink
    spawnFoodItems(foodTypes) {
        const sink = this.config.SINK;
        const safeMargin = 80; // margin from walls
        const drainAvoidRadius = 100; // stay away from drain

        foodTypes.forEach((foodType, index) => {
            const itemConfig = this.config.FOOD_ITEMS[foodType];

            // Generate completely random position, avoiding drain and walls
            let x, y, attempts = 0;
            do {
                x = sink.CENTER_X - (sink.WIDTH / 2 - safeMargin) + Math.random() * (sink.WIDTH - safeMargin * 2);
                y = sink.CENTER_Y - (sink.HEIGHT / 2 - safeMargin) + Math.random() * (sink.HEIGHT - safeMargin * 2);

                const distanceFromDrain = Math.sqrt(
                    (x - sink.CENTER_X) ** 2 +
                    (y - sink.CENTER_Y) ** 2
                );

                // Accept position if far enough from drain
                if (distanceFromDrain > drainAvoidRadius) break;

                attempts++;
            } while (attempts < 50); // fallback after 50 attempts

            let body;
            if (foodType === 'spaghetti') {
                // Spaghetti is elongated
                body = Matter.Bodies.rectangle(x, y, itemConfig.width, itemConfig.height, {
                    mass: itemConfig.mass,
                    friction: itemConfig.friction,
                    restitution: itemConfig.restitution,
                    angle: Math.random() * Math.PI * 2
                });
            } else {
                // Other items are circular
                body = Matter.Bodies.circle(x, y, itemConfig.radius, {
                    mass: itemConfig.mass,
                    friction: itemConfig.friction,
                    restitution: itemConfig.restitution
                });
            }

            body.foodType = foodType;
            body.inDrain = false;
            this.gameState.foodBodies.push(body);
            Matter.World.add(this.world, body);
        });
    }

    // Create water droplet
    createWaterDrop(x, y) {
        // Check if position is within square sink
        const sink = this.config.SINK;
        const halfWidth = sink.WIDTH / 2;
        const halfHeight = sink.HEIGHT / 2;
        const left = sink.CENTER_X - halfWidth;
        const right = sink.CENTER_X + halfWidth;
        const top = sink.CENTER_Y - halfHeight;
        const bottom = sink.CENTER_Y + halfHeight;

        if (x < left || x > right || y < top || y > bottom) return;

        // Generate random angle for omnidirectional spray
        const angle = Math.random() * Math.PI * 2;
        const forceMagnitude = this.config.WATER.DROP_FORCE;
        const forceX = Math.cos(angle) * forceMagnitude;
        const forceY = Math.sin(angle) * forceMagnitude;

        const drop = Matter.Bodies.circle(x, y, this.config.WATER.DROP_RADIUS, {
            mass: this.config.WATER.DROP_MASS,
            friction: this.config.WATER.FRICTION,
            restitution: this.config.WATER.RESTITUTION,
            force: { x: forceX, y: forceY },
            label: 'water'
        });

        drop.lifetime = 0;
        drop.maxLifetime = 3000; // 3 seconds

        this.gameState.waterBodies.push(drop);
        Matter.World.add(this.world, drop);

        // Play water drip sound
        this.playWaterDripSound();

        // Update water usage
        this.gameState.waterUsed += this.config.WATER.GALLONS_PER_DROP;
        this.gameState.totalWaterUsed += this.config.WATER.GALLONS_PER_DROP;

        // Check for water usage alerts
        const currentLevel = this.config.LEVELS[this.gameState.currentLevel - 1];
        const waterLimit = currentLevel.waterLimit;
        const percentage = this.gameState.waterUsed / waterLimit;

        // Play yellow alert at 80%
        if (percentage >= 0.8 && percentage < 1.0 && !this.gameState.yellowAlertPlayed) {
            this.playYellowAlert();
            this.gameState.yellowAlertPlayed = true;
        }

        // Play red alert when exceeding limit
        if (percentage >= 1.0 && !this.gameState.redAlertPlayed) {
            this.playRedAlert();
            this.gameState.redAlertPlayed = true;
        }
    }

    // Apply drain force and incline to objects
    applyDrainForce() {
        const sink = this.config.SINK;
        const drainForce = this.config.PHYSICS.DRAIN_FORCE;
        const forceRadius = this.config.PHYSICS.DRAIN_FORCE_RADIUS;
        const inclineStrength = sink.INCLINE_STRENGTH;

        // Apply to food items
        this.gameState.foodBodies.forEach(body => {
            const dx = sink.CENTER_X - body.position.x;
            const dy = sink.CENTER_Y - body.position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Incline force - only applies to moving objects (simulates slope when pushed)
            // Objects at rest stay at rest due to static friction
            const velocity = Math.sqrt(body.velocity.x ** 2 + body.velocity.y ** 2);
            const minVelocity = 0.3; // minimum speed to feel incline effect (increased for more resistance)

            if (distance > 0 && velocity > minVelocity) {
                const inclineForceMag = inclineStrength * body.mass;
                const inclineForceX = (dx / distance) * inclineForceMag;
                const inclineForceY = (dy / distance) * inclineForceMag;
                Matter.Body.applyForce(body, body.position, { x: inclineForceX, y: inclineForceY });
            }

            // Drain suction force - stronger near drain
            if (distance < forceRadius && distance > 0) {
                const forceMagnitude = drainForce * (1 - distance / forceRadius);
                const forceX = (dx / distance) * forceMagnitude * body.mass;
                const forceY = (dy / distance) * forceMagnitude * body.mass;

                Matter.Body.applyForce(body, body.position, { x: forceX, y: forceY });
            }

            // Check if item is in drain
            if (distance < this.config.LIMITS.DRAIN_CAPTURE_RADIUS && !body.inDrain) {
                body.inDrain = true;
                this.itemEnteredDrain(body);
            }
        });

        // Apply to water droplets
        this.gameState.waterBodies.forEach(body => {
            const dx = sink.CENTER_X - body.position.x;
            const dy = sink.CENTER_Y - body.position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Incline force for water - water flows easier, so lower velocity threshold
            const velocity = Math.sqrt(body.velocity.x ** 2 + body.velocity.y ** 2);
            const minVelocity = 0.15; // water flows easier than solid objects

            if (distance > 0 && velocity > minVelocity) {
                const inclineForceMag = inclineStrength * body.mass * 1.2; // water flows slightly easier down incline
                const inclineForceX = (dx / distance) * inclineForceMag;
                const inclineForceY = (dy / distance) * inclineForceMag;
                Matter.Body.applyForce(body, body.position, { x: inclineForceX, y: inclineForceY });
            }

            // Drain suction for water
            if (distance < forceRadius && distance > 0) {
                const forceMagnitude = drainForce * (1 - distance / forceRadius) * 2; // water drains faster
                const forceX = (dx / distance) * forceMagnitude * body.mass;
                const forceY = (dy / distance) * forceMagnitude * body.mass;

                Matter.Body.applyForce(body, body.position, { x: forceX, y: forceY });
            }
        });
    }

    // Handle item entering drain
    itemEnteredDrain(body) {
        this.gameState.itemsRemaining--;
        this.gameState.score += 50; // points per item

        // Play plop sound
        this.playPlopSound();

        // Remove body after animation (scale down effect)
        setTimeout(() => {
            Matter.World.remove(this.world, body);
            const index = this.gameState.foodBodies.indexOf(body);
            if (index > -1) {
                this.gameState.foodBodies.splice(index, 1);
            }
        }, 500);

        // Check win condition
        if (this.gameState.itemsRemaining <= 0) {
            this.levelComplete();
        }
    }

    // Level complete
    levelComplete() {
        // Track if mouse was down when banner appeared (for click-to-dismiss)
        this.gameState.bannerNeedsRelease = this.gameState.isMouseDown;

        // Stop water spray if user is holding down
        this.gameState.isMouseDown = false;

        // Show banner and auto-advance after 5 seconds
        this.gameState.showingLevelBanner = true;
        this.gameState.bannerStartTime = Date.now();
        this.gameState.bannerDuration = 5000; // 5 seconds

        const currentLevel = this.config.LEVELS[this.gameState.currentLevel - 1];

        // Bonus for staying under water limit
        if (this.gameState.waterUsed <= currentLevel.waterLimit) {
            this.gameState.score += 100;
        }

        // Auto-advance after 5 seconds
        this.bannerTimeout = setTimeout(() => {
            this.advanceFromBanner();
        }, 5000);
    }

    // Advance from banner (called by timeout or click)
    advanceFromBanner() {
        if (!this.gameState.showingLevelBanner) return;

        // Ensure water spray is stopped
        this.gameState.isMouseDown = false;

        this.gameState.showingLevelBanner = false;
        if (this.bannerTimeout) {
            clearTimeout(this.bannerTimeout);
            this.bannerTimeout = null;
        }
        this.nextLevel();
    }

    // Next level
    nextLevel() {
        if (this.gameState.currentLevel >= this.config.LEVELS.length) {
            this.gameState.isGameOver = true;
            this.gameState.isWon = false;
        } else {
            this.startLevel(this.gameState.currentLevel + 1);
        }
    }

    // Restart game
    restartGame() {
        this.gameState.score = 0;
        this.gameState.totalWaterUsed = 0;
        this.gameState.isGameOver = false;
        this.startLevel(1);
    }

    // Update physics and game logic
    update(deltaTime) {
        if (this.gameState.isPaused) return;

        // Update physics
        Matter.Engine.update(this.engine, deltaTime);

        // Create water drops
        const now = Date.now();
        if (this.gameState.isMouseDown && now - this.lastDropTime >= this.config.WATER.DROP_RATE) {
            this.createWaterDrop(this.gameState.mouseX, this.gameState.mouseY);
            this.lastDropTime = now;
        }

        // Apply drain force
        this.applyDrainForce();

        // Update water droplet lifetimes
        this.gameState.waterBodies = this.gameState.waterBodies.filter(drop => {
            drop.lifetime += deltaTime;

            // Remove if too old or in drain
            const dx = drop.position.x - this.config.SINK.CENTER_X;
            const dy = drop.position.y - this.config.SINK.CENTER_Y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (drop.lifetime > drop.maxLifetime || distance < this.config.SINK.DRAIN_RADIUS) {
                Matter.World.remove(this.world, drop);
                return false;
            }
            return true;
        });
    }

    // Render
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Scale context to match canvas size
        this.ctx.save();
        this.ctx.scale(this.renderScale, this.renderScale);

        // Draw everything at base resolution
        this.graphics.drawScene(this.gameState);
        this.graphics.drawUI(this.gameState);

        if (this.gameState.showingLevelBanner) {
            this.graphics.drawLevelBanner(this.gameState, this.config.LEVELS);
        }

        if (this.gameState.isGameOver) {
            this.graphics.drawGameOverScreen(this.gameState);
        }

        this.ctx.restore();
    }

    // Main animation loop
    animate(timestamp = 0) {
        const deltaTime = timestamp - this.lastPhysicsUpdate || 16;
        this.lastPhysicsUpdate = timestamp;

        this.update(Math.min(deltaTime, 33)); // cap at ~30fps for stability
        this.render();

        requestAnimationFrame((t) => this.animate(t));
    }
}
