# Talk-To-My-Lawyer Animation Guide

This guide explains the animation system implemented for Talk-To-My-Lawyer, focusing on the sophisticated hero animations and blue running border buttons.

## Animation Philosophy

Our animations are designed to be:
- **Professional & Sophisticated**: Subtle but engaging, not distracting
- **Performance Optimized**: GPU-accelerated with proper will-change properties
- **Accessible**: Respect prefers-reduced-motion settings
- **Trust-Building**: Smooth animations that convey reliability and polish

## Key Animation Components

### 1. Blue Running Border Animation

The signature animation for primary CTA buttons creates a continuously rotating blue border that appears on hover.

```tsx
// Usage with Button component
<Button variant="running_border" className="glow-enhanced">
  Get Started
</Button>
```

#### Key Features:
- Conic gradient that rotates 360° every 3 seconds
- Only appears on hover to avoid distraction
- Smooth opacity transitions
- Includes glow effect on hover

#### CSS Classes:
- `btn-running-border`: Base class for the animation
- `glow-enhanced`: Adds a radial glow effect on hover
- `gpu-accelerated`: Optimizes performance

### 2. Animated Button Component

A standalone component with multiple variants and optional magnetic effect.

```tsx
import AnimatedButton from '@/components/ui/animated-button'

<AnimatedButton
  variant="blue-border"
  size="lg"
  magnetic={true}
>
  Click Me
</AnimatedButton>
```

#### Variants:
- `primary`: Standard blue gradient button
- `secondary`: White with blue border
- `blue-border`: Features the rotating border animation

#### Props:
- `magnetic`: Enables mouse-tracking magnetic effect
- `size`: 'sm', 'md', or 'lg'

### 3. Hero Section Animations

The hero section uses multiple layers of animation for depth and engagement.

#### Background Elements:
- **Morphing Gradient Orbs**: Large, slowly morphing gradient circles
- **Floating Particles**: Small particles that float and scale
- **Grid Pattern**: Subtle background grid for structure

#### Content Animations:
- **Staggered Fade-ins**: Elements appear with carefully timed delays
- **Spring Physics**: Natural, bouncy animations on interaction
- **Parallax Effects**: Elements move at different speeds on scroll

## CSS Animation Library

### Available Animation Classes:

#### Button Effects:
- `btn-running-border`: Primary rotating border animation
- `btn-enhanced-cta`: Enhanced CTA with shimmer
- `ripple`: Click ripple effect
- `magnetic-btn`: Enables magnetic behavior

#### Text Effects:
- `text-shimmer`: Shimmering text highlight
- `typewriter`: Typing animation effect

#### Container Effects:
- `morphing-bg`: Morphing background shape
- `glow-enhanced`: Glow effect on hover
- `stagger-item`: For staggered list animations

#### Performance:
- `gpu-accelerated`: Optimizes element for GPU rendering

## Animation Timing & Easing

### Standard Durations:
- Fast interactions: 150-300ms
- Hover states: 300ms
- Page transitions: 500-800ms
- Background animations: 20-40s (continuous)

### Easing Functions:
- Spring physics: `cubic-bezier(0.4, 0, 0.2, 1)`
- Smooth transitions: `easeInOut`
- Bounce effects: `spring` with stiffness/damping

## Accessibility

All animations respect `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  /* All animations are disabled */
  .animation-class {
    animation: none !important;
    transition: none !important;
  }
}
```

## Performance Optimization

1. **GPU Acceleration**: Use `gpu-accelerated` class for complex animations
2. **Will-Change**: Properly set for predictable animations
3. **Reduced Motion**: Automatic detection and optimization
4. **Optimized Transitions**: Only animate transform/opacity for 60fps

## Implementation Examples

### 1. CTA Button with Running Border:

```tsx
<motion.div
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.98 }}
>
  <Button
    variant="running_border"
    size="lg"
    className="glow-enhanced gpu-accelerated"
  >
    Get Started
  </Button>
</motion.div>
```

### 2. Floating Animation:

```tsx
<motion.div
  animate={{
    y: [0, -20, 0],
  }}
  transition={{
    duration: 3,
    repeat: Infinity,
    ease: "easeInOut"
  }}
>
  <Content />
</motion.div>
```

### 3. Staggered List:

```tsx
{items.map((item, index) => (
  <motion.div
    key={item.id}
    className="stagger-item"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{
      delay: index * 0.1,
      type: "spring",
      stiffness: 100
    }}
  >
    {item.content}
  </motion.div>
))}
```

## Best Practices

1. **Keep it Subtle**: Animations should enhance, not distract
2. **Maintain Consistency**: Use similar timings and easing throughout
3. **Test Performance**: Monitor frame rate, especially on mobile
4. **Consider Accessibility**: Always provide reduced-motion alternatives
5. **Purpose-Driven**: Each animation should have a clear purpose

## Browser Support

- Modern browsers (Chrome 60+, Firefox 55+, Safari 12+)
- Fallbacks provided for older browsers
- Graceful degradation without animation

## Troubleshooting

### Animation not smooth?
- Add `gpu-accelerated` class
- Check if animating non-transform properties
- Verify no layout thrashing

### Animation not playing?
- Check for `prefers-reduced-motion` setting
- Verify CSS classes are applied correctly
- Ensure no conflicting animations

### Performance issues?
- Reduce number of simultaneous animations
- Use `will-change` sparingly
- Consider reducing animation complexity