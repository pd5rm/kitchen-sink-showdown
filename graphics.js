// Graphics Renderer - Cartoon Style
class GraphicsRenderer {
    constructor(ctx, config) {
        this.ctx = ctx;
        this.config = config;
    }

    // Draw the entire scene
    drawScene(gameState) {
        this.ctx.clearRect(0, 0, this.config.CANVAS_WIDTH, this.config.CANVAS_HEIGHT);

        this.drawBackground();
        this.drawSink();
        this.drawDrain();
        this.drawFoodItems(gameState.foodBodies);
        this.drawWaterDroplets(gameState.waterBodies);
        this.drawFaucet(gameState.mouseX, gameState.mouseY);
    }

    // Draw background (countertop)
    drawBackground() {
        const ctx = this.ctx;

        // Counter gradient
        const gradient = ctx.createLinearGradient(0, 0, this.config.CANVAS_WIDTH, this.config.CANVAS_HEIGHT);
        gradient.addColorStop(0, this.config.COLORS.COUNTER);
        gradient.addColorStop(1, '#6D4C41'); // slightly darker
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.config.CANVAS_WIDTH, this.config.CANVAS_HEIGHT);

        // Add some counter texture (subtle)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * this.config.CANVAS_WIDTH;
            const y = Math.random() * this.config.CANVAS_HEIGHT;
            ctx.fillRect(x, y, 2, 2);
        }
    }

    // Draw sink (square top-down view with incline gradient)
    drawSink() {
        const ctx = this.ctx;
        const sink = this.config.SINK;
        const halfWidth = sink.WIDTH / 2;
        const halfHeight = sink.HEIGHT / 2;
        const left = sink.CENTER_X - halfWidth;
        const right = sink.CENTER_X + halfWidth;
        const top = sink.CENTER_Y - halfHeight;
        const bottom = sink.CENTER_Y + halfHeight;

        // Outer sink rim
        ctx.fillStyle = this.config.COLORS.SINK_OUTER;
        ctx.fillRect(left - 10, top - 10, sink.WIDTH + 20, sink.HEIGHT + 20);

        // Add rim shine (top-left corner)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(left - 10, top - 10);
        ctx.lineTo(right + 10, top - 10);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(left - 10, top - 10);
        ctx.lineTo(left - 10, bottom + 10);
        ctx.stroke();

        // Inner sink bowl with radial gradient showing incline toward center drain
        const maxDist = Math.sqrt(halfWidth * halfWidth + halfHeight * halfHeight);
        const sinkGradient = ctx.createRadialGradient(
            sink.CENTER_X, sink.CENTER_Y, sink.DRAIN_RADIUS,
            sink.CENTER_X, sink.CENTER_Y, maxDist
        );
        sinkGradient.addColorStop(0, this.config.COLORS.SINK_SHADOW);
        sinkGradient.addColorStop(0.4, this.config.COLORS.SINK_INNER);
        sinkGradient.addColorStop(1, this.config.COLORS.SINK_OUTER);

        ctx.fillStyle = sinkGradient;
        ctx.fillRect(left, top, sink.WIDTH, sink.HEIGHT);

        // Sink outline
        ctx.strokeStyle = this.config.COLORS.UI_BORDER;
        ctx.lineWidth = 3;
        ctx.strokeRect(left, top, sink.WIDTH, sink.HEIGHT);

        // Add corner shadows to emphasize square shape and depth
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        const cornerSize = 40;

        // Top-left corner shadow
        const cornerGrad1 = ctx.createRadialGradient(left, top, 0, left, top, cornerSize);
        cornerGrad1.addColorStop(0, 'rgba(0, 0, 0, 0.2)');
        cornerGrad1.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = cornerGrad1;
        ctx.fillRect(left, top, cornerSize, cornerSize);

        // Top-right corner shadow
        const cornerGrad2 = ctx.createRadialGradient(right, top, 0, right, top, cornerSize);
        cornerGrad2.addColorStop(0, 'rgba(0, 0, 0, 0.2)');
        cornerGrad2.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = cornerGrad2;
        ctx.fillRect(right - cornerSize, top, cornerSize, cornerSize);

        // Bottom-left corner shadow
        const cornerGrad3 = ctx.createRadialGradient(left, bottom, 0, left, bottom, cornerSize);
        cornerGrad3.addColorStop(0, 'rgba(0, 0, 0, 0.2)');
        cornerGrad3.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = cornerGrad3;
        ctx.fillRect(left, bottom - cornerSize, cornerSize, cornerSize);

        // Bottom-right corner shadow
        const cornerGrad4 = ctx.createRadialGradient(right, bottom, 0, right, bottom, cornerSize);
        cornerGrad4.addColorStop(0, 'rgba(0, 0, 0, 0.2)');
        cornerGrad4.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = cornerGrad4;
        ctx.fillRect(right - cornerSize, bottom - cornerSize, cornerSize, cornerSize);
    }

    // Draw drain
    drawDrain() {
        const ctx = this.ctx;
        const sink = this.config.SINK;

        // Drain shadow/glow
        ctx.beginPath();
        ctx.arc(sink.CENTER_X, sink.CENTER_Y, sink.DRAIN_RADIUS + 5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fill();

        // Drain hole
        ctx.beginPath();
        ctx.arc(sink.CENTER_X, sink.CENTER_Y, sink.DRAIN_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = this.config.COLORS.DRAIN;
        ctx.fill();

        // Drain grate (cross pattern)
        ctx.strokeStyle = this.config.COLORS.DRAIN_GRATE;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';

        // Vertical line
        ctx.beginPath();
        ctx.moveTo(sink.CENTER_X, sink.CENTER_Y - sink.DRAIN_RADIUS + 5);
        ctx.lineTo(sink.CENTER_X, sink.CENTER_Y + sink.DRAIN_RADIUS - 5);
        ctx.stroke();

        // Horizontal line
        ctx.beginPath();
        ctx.moveTo(sink.CENTER_X - sink.DRAIN_RADIUS + 5, sink.CENTER_Y);
        ctx.lineTo(sink.CENTER_X + sink.DRAIN_RADIUS - 5, sink.CENTER_Y);
        ctx.stroke();

        // Circular grate lines
        for (let i = 1; i <= 2; i++) {
            ctx.beginPath();
            ctx.arc(sink.CENTER_X, sink.CENTER_Y, sink.DRAIN_RADIUS * (i / 3), 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    // Draw food items as sprites
    drawFoodItems(foodBodies) {
        foodBodies.forEach(body => {
            const itemConfig = this.config.FOOD_ITEMS[body.foodType];
            if (!itemConfig) return;

            const ctx = this.ctx;
            const pos = body.position;

            ctx.save();
            ctx.translate(pos.x, pos.y);
            ctx.rotate(body.angle);

            // Draw sprite (emoji)
            ctx.font = `${itemConfig.spriteSize}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Add drop shadow for depth
            ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
            ctx.shadowBlur = 4;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;

            ctx.fillText(itemConfig.sprite, 0, 0);

            ctx.restore();
        });
    }


    // Draw water spray particles
    drawWaterDroplets(waterBodies) {
        const ctx = this.ctx;

        waterBodies.forEach(body => {
            const pos = body.position;
            const vel = body.velocity;
            const r = this.config.WATER.DROP_RADIUS;

            // Calculate velocity magnitude for motion blur
            const speed = Math.sqrt(vel.x * vel.x + vel.y * vel.y);
            const motionBlur = Math.min(speed * 2, 15); // Cap motion blur length

            // Calculate motion direction
            const angle = Math.atan2(vel.y, vel.x);

            // Vary particle size based on lifetime for more natural look
            const lifetimeRatio = body.lifetime / body.maxLifetime;
            const particleSize = r * (1 - lifetimeRatio * 0.3); // Shrink as it ages

            ctx.save();

            // Draw motion streak/trail
            if (speed > 0.5) {
                ctx.globalAlpha = 0.3;
                ctx.strokeStyle = 'rgba(200, 230, 255, 0.5)';
                ctx.lineWidth = particleSize * 1.5;
                ctx.lineCap = 'round';

                ctx.beginPath();
                ctx.moveTo(
                    pos.x - Math.cos(angle) * motionBlur,
                    pos.y - Math.sin(angle) * motionBlur
                );
                ctx.lineTo(pos.x, pos.y);
                ctx.stroke();
            }

            // Main particle (small, bright)
            ctx.globalAlpha = 0.7 - lifetimeRatio * 0.4; // Fade out over time
            ctx.fillStyle = 'rgba(220, 240, 255, 0.9)';
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, particleSize * 0.8, 0, Math.PI * 2);
            ctx.fill();

            // Bright core
            ctx.globalAlpha = 0.9;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, particleSize * 0.4, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        });
    }

    // Draw faucet at cursor position
    drawFaucet(x, y) {
        const ctx = this.ctx;

        // Only draw if cursor is over the square sink
        const sink = this.config.SINK;
        const halfWidth = sink.WIDTH / 2;
        const halfHeight = sink.HEIGHT / 2;
        const left = sink.CENTER_X - halfWidth;
        const right = sink.CENTER_X + halfWidth;
        const top = sink.CENTER_Y - halfHeight;
        const bottom = sink.CENTER_Y + halfHeight;

        if (x < left || x > right || y < top || y > bottom) return;

        // Faucet cursor (simple droplet shape)
        ctx.fillStyle = 'rgba(100, 181, 246, 0.5)';
        ctx.beginPath();
        ctx.arc(x, y, 15, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(66, 165, 245, 0.8)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Crosshair
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x - 10, y);
        ctx.lineTo(x + 10, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y - 10);
        ctx.lineTo(x, y + 10);
        ctx.stroke();
    }

    // Draw UI elements
    drawUI(gameState) {
        this.drawWaterMeter(gameState);
        this.drawLevelInfo(gameState);
    }

    // Water usage meter
    drawWaterMeter(gameState) {
        const ctx = this.ctx;
        const x = 5;
        const y = 180;
        const width = 50;
        const height = 350;
        const currentLevel = this.config.LEVELS[gameState.currentLevel - 1];
        const waterLimit = currentLevel.waterLimit;
        const percentage = gameState.waterUsed / waterLimit;
        const exceeded = percentage > 1;

        // Panel background
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        ctx.roundRect(x - 10, y - 40, width + 20, height + 80, 10);
        ctx.fill();
        ctx.strokeStyle = this.config.COLORS.UI_BORDER;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Title
        ctx.fillStyle = this.config.COLORS.TEXT;
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('WATER', x + width / 2, y - 15);

        // Meter border
        ctx.strokeStyle = this.config.COLORS.UI_BORDER;
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, width, height);

        // Fill meter with wavy animation
        const fillHeight = Math.min(percentage, 1) * height;
        const fillY = y + height - fillHeight;

        // Color based on usage
        let fillColor;
        if (exceeded) {
            fillColor = this.config.COLORS.DANGER;
        } else if (percentage > 0.8) {
            fillColor = this.config.COLORS.WARNING;
        } else {
            fillColor = this.config.COLORS.WATER;
        }

        // Draw water fill with wavy top
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, width, height);
        ctx.clip();

        // Solid fill
        ctx.fillStyle = fillColor;
        ctx.fillRect(x, fillY + 5, width, fillHeight);

        // Animated wavy surface
        if (fillHeight > 10) {
            const time = Date.now() / 500; // Animation speed
            const waveAmplitude = 3;
            const waveFrequency = 0.15;

            ctx.beginPath();
            ctx.moveTo(x, fillY);

            // Draw sine wave
            for (let px = 0; px <= width; px += 2) {
                const waveY = fillY + Math.sin(px * waveFrequency + time) * waveAmplitude;
                ctx.lineTo(x + px, waveY);
            }

            ctx.lineTo(x + width, fillY + 10);
            ctx.lineTo(x, fillY + 10);
            ctx.closePath();
            ctx.fill();

            // Lighter wave overlay for shimmer effect
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.beginPath();
            ctx.moveTo(x, fillY + 2);

            for (let px = 0; px <= width; px += 2) {
                const waveY = fillY + 2 + Math.sin(px * waveFrequency * 1.5 + time * 1.2) * (waveAmplitude * 0.7);
                ctx.lineTo(x + px, waveY);
            }

            ctx.lineTo(x + width, fillY + 8);
            ctx.lineTo(x, fillY + 8);
            ctx.closePath();
            ctx.fill();
        }

        ctx.restore();

        // Overflow indicator
        if (exceeded) {
            // Animated warning
            const blink = Math.floor(Date.now() / 300) % 2;
            if (blink) {
                ctx.fillStyle = this.config.COLORS.DANGER;
                ctx.fillRect(x, y, width, height);
            }

            // Warning icon
            ctx.fillStyle = '#FFF';
            ctx.font = 'bold 30px Arial';
            ctx.fillText('⚠', x + width / 2, y + height / 2 + 10);
        }

        // Water level marks
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.lineWidth = 1;
        for (let i = 0.25; i <= 0.75; i += 0.25) {
            const markY = y + height * (1 - i);
            ctx.beginPath();
            ctx.moveTo(x, markY);
            ctx.lineTo(x + width, markY);
            ctx.stroke();
        }

        // "OVER LIMIT!" warning only
        if (exceeded) {
            ctx.fillStyle = this.config.COLORS.DANGER;
            ctx.font = 'bold 11px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('OVER LIMIT!', x + width / 2, y + height + 15);
        }
    }

    // Level information
    drawLevelInfo(gameState) {
        const ctx = this.ctx;
        const x = this.config.CANVAS_WIDTH - 175;
        const y = 10;
        const currentLevel = this.config.LEVELS[gameState.currentLevel - 1];
        const totalLevels = this.config.LEVELS.length;

        // Panel background
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        ctx.roundRect(x, y, 170, 75, 10);
        ctx.fill();
        ctx.strokeStyle = this.config.COLORS.UI_BORDER;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Level number with total
        ctx.fillStyle = this.config.COLORS.TEXT;
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`Level ${gameState.currentLevel} of ${totalLevels}`, x + 15, y + 35);

        // Level name
        ctx.font = '14px Arial';
        ctx.fillStyle = this.config.COLORS.TEXT_LIGHT;
        ctx.fillText(currentLevel.name, x + 15, y + 60);
    }

    // Score display
    drawScore(gameState) {
        const ctx = this.ctx;
        const x = this.config.CANVAS_WIDTH - 220;
        const y = 140;

        // Panel background
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        ctx.roundRect(x, y, 200, 60, 10);
        ctx.fill();
        ctx.strokeStyle = this.config.COLORS.UI_BORDER;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Score
        ctx.fillStyle = this.config.COLORS.TEXT;
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('SCORE', x + 15, y + 25);

        ctx.font = 'bold 24px Arial';
        ctx.fillStyle = this.config.COLORS.SUCCESS;
        ctx.fillText(gameState.score.toString(), x + 15, y + 50);
    }

    // Win screen
    // Draw level transition banner with countdown
    drawLevelBanner(gameState, levels) {
        const ctx = this.ctx;
        const nextLevelIndex = gameState.currentLevel; // currentLevel is 0-indexed for next level

        // Check if there's a next level
        if (nextLevelIndex >= levels.length) {
            return; // No banner for game over
        }

        const nextLevel = levels[nextLevelIndex];

        // Calculate remaining time
        const elapsed = Date.now() - gameState.bannerStartTime;
        const remaining = Math.max(0, gameState.bannerDuration - elapsed);
        const countdown = Math.ceil(remaining / 1000);

        // Banner properties
        const bannerHeight = 140;
        const bannerY = (this.config.CANVAS_HEIGHT - bannerHeight) / 2;

        // Semi-transparent background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, bannerY, this.config.CANVAS_WIDTH, bannerHeight);

        // Banner background with gradient
        const gradient = ctx.createLinearGradient(0, bannerY, 0, bannerY + bannerHeight);
        gradient.addColorStop(0, 'rgba(66, 165, 245, 0.95)');
        gradient.addColorStop(1, 'rgba(33, 150, 243, 0.95)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, bannerY, this.config.CANVAS_WIDTH, bannerHeight);

        // Top border
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(0, bannerY, this.config.CANVAS_WIDTH, 2);

        // Bottom border
        ctx.fillRect(0, bannerY + bannerHeight - 2, this.config.CANVAS_WIDTH, 2);

        // Text content
        ctx.textAlign = 'center';

        // "Next Level" text
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '18px Arial';
        ctx.fillText('NEXT LEVEL', this.config.CANVAS_WIDTH / 2, bannerY + 35);

        // Level name
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 32px Arial';
        ctx.fillText(nextLevel.name, this.config.CANVAS_WIDTH / 2, bannerY + 70);

        // Level description
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = '16px Arial';
        ctx.fillText(nextLevel.description, this.config.CANVAS_WIDTH / 2, bannerY + 100);

        // Countdown and click hint
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = 'bold 18px Arial';
        ctx.fillText(`${countdown}  •  Click to Continue`, this.config.CANVAS_WIDTH / 2, bannerY + 125);
    }

    // Game over screen (all levels complete)
    drawGameOverScreen(gameState) {
        const ctx = this.ctx;

        // Semi-transparent overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, this.config.CANVAS_WIDTH, this.config.CANVAS_HEIGHT);

        // Win panel
        const panelWidth = 500;
        const panelHeight = 400;
        const panelX = (this.config.CANVAS_WIDTH - panelWidth) / 2;
        const panelY = (this.config.CANVAS_HEIGHT - panelHeight) / 2;

        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.roundRect(panelX, panelY, panelWidth, panelHeight, 20);
        ctx.fill();
        ctx.strokeStyle = this.config.COLORS.SUCCESS;
        ctx.lineWidth = 5;
        ctx.stroke();

        // Title
        ctx.fillStyle = this.config.COLORS.SUCCESS;
        ctx.font = 'bold 56px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🎉 VICTORY! 🎉', this.config.CANVAS_WIDTH / 2, panelY + 80);

        ctx.fillStyle = this.config.COLORS.TEXT;
        ctx.font = '24px Arial';
        ctx.fillText('All Levels Complete!', this.config.CANVAS_WIDTH / 2, panelY + 130);

        // Final score
        ctx.font = 'bold 36px Arial';
        ctx.fillStyle = this.config.COLORS.SUCCESS;
        ctx.fillText(`Final Score: ${gameState.score}`, this.config.CANVAS_WIDTH / 2, panelY + 200);

        // Stats
        ctx.fillStyle = this.config.COLORS.TEXT;
        ctx.font = '18px Arial';
        ctx.fillText(
            `Total Water Used: ${gameState.totalWaterUsed.toFixed(1)}`,
            this.config.CANVAS_WIDTH / 2,
            panelY + 250
        );

        // Play again
        ctx.fillStyle = this.config.COLORS.TEXT_LIGHT;
        ctx.font = '20px Arial';
        ctx.fillText('Click to Play Again', this.config.CANVAS_WIDTH / 2, panelY + 330);
    }
}
