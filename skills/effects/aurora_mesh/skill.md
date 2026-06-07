# Skill: Aurora Mesh Gradient using Plain HTML & CSS

**Purpose:**
To create a stunning, atmospheric background effect (like an aurora or mesh gradient) using simple CSS shapes and heavy blurring.

**Description:**
This skill enables the design agent to generate a dynamic, blurred background using overlapping shapes (circles or ellipses). In this specific example, it uses the colors `#BFE4FF` (light cyan) and `#FF8F00` (orange/gold) against a dark background, applying different `blur` filter amounts.

## Code Example

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Aurora Mesh Gradient</title>
<style>
  body {
    margin: 0;
    padding: 0;
    background-color: #0f1011; /* Very dark background */
    overflow: hidden;
    height: 100vh;
    width: 100vw;
    position: relative;
  }

  .mesh-container {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    z-index: 0; /* Keep it behind other content */
    overflow: hidden;
  }

  .shape {
    position: absolute;
    border-radius: 50%;
  }

  /* Shape 1: Large Orange/Gold Ellipse */
  .shape-1 {
    width: 60vw;
    height: 80vh;
    background-color: #FF8F00;
    filter: blur(150px);
    top: 50%;
    left: 60%;
    transform: translate(-50%, -50%) rotate(30deg);
    opacity: 0.6;
  }

  /* Shape 2: Light Blue/Cyan Shape */
  .shape-2 {
    width: 50vw;
    height: 60vh;
    background-color: #BFE4FF;
    filter: blur(130px);
    top: 10%;
    left: 20%;
    transform: translate(-50%, -50%);
    opacity: 0.4;
  }

  /* Shape 3: Subtle secondary orange */
  .shape-3 {
    width: 40vw;
    height: 50vh;
    background-color: #FF8F00;
    filter: blur(120px);
    bottom: -10%;
    left: 10%;
    opacity: 0.3;
  }
</style>
</head>
<body>
  <!-- Background Mesh Gradient Elements -->
  <div class="mesh-container">
    <div class="shape shape-1"></div>
    <div class="shape shape-2"></div>
    <div class="shape shape-3"></div>
  </div>
  
  <!-- Add your foreground content here. Ensure it has a higher z-index than .mesh-container -->
</body>
</html>
```

## How it works:
1.  **Container (`.mesh-container`)**: Fills the viewport and uses `overflow: hidden` to contain the blurry glow from overflowing the page and creating scrollbars.
2.  **Shapes (`.shape`)**: Base style sets absolute positioning and `border-radius: 50%` to make them curved (circles/ellipses depending on width/height ratio).
3.  **Colors and Blurs (`filter: blur(...)`)**: The magical ingredient. A high blur value (e.g., 100px - 150px) diffuses the solid color over a wide area. Mixing colors like `#BFE4FF` and `#FF8F00` with varying opacities allows the colors to blend into one another seamlessly against the dark background (`#0f1011`).
4.  **Transformations (`transform`, `rotate`)**: Rotating an ellipse adds organic, sweeping curves to the light fields, making it look much more natural and dynamic than perfectly aligned circles.
