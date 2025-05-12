// File selection functionality
function showFiles(fileType) {
  const htmlFiles = document.getElementById('htmlFiles');
  const xmlFiles = document.getElementById('xmlFiles');
  const xsltFiles = document.getElementById('xsltFiles');
  
  // Hide all file lists first with animation
  [htmlFiles, xmlFiles, xsltFiles].forEach(element => {
    if (element.style.display === 'block') {
      fadeOut(element, 300);
    }
  });
  
  // Show the selected file list with animation
  setTimeout(() => {
    [htmlFiles, xmlFiles, xsltFiles].forEach(element => {
      element.style.display = 'none';
    });
    
    if (fileType === 'html') {
      fadeIn(htmlFiles, 300);
    } else if (fileType === 'xml') {
      fadeIn(xmlFiles, 300);
    } else if (fileType === 'xslt') {
      fadeIn(xsltFiles, 300);
    }
  }, 300);
}

// Fade in animation
function fadeIn(element, duration) {
  element.style.opacity = 0;
  element.style.display = 'block';
  
  let start = null;
  function animate(timestamp) {
    if (!start) start = timestamp;
    const progress = timestamp - start;
    element.style.opacity = Math.min(progress / duration, 1);
    
    if (progress < duration) {
      window.requestAnimationFrame(animate);
    }
  }
  
  window.requestAnimationFrame(animate);
}

// Fade out animation
function fadeOut(element, duration) {
  element.style.opacity = 1;
  
  let start = null;
  function animate(timestamp) {
    if (!start) start = timestamp;
    const progress = timestamp - start;
    element.style.opacity = Math.max(1 - progress / duration, 0);
    
    if (progress < duration) {
      window.requestAnimationFrame(animate);
    }
  }
  
  window.requestAnimationFrame(animate);
}

// File content loading functionality
async function loadFileContent(filePath) {
  try {
    const contentDiv = document.getElementById('popupContent');
    const iframe = document.getElementById('popupIframe');
    const popup = document.getElementById('popup');
    const overlay = document.getElementById('overlay');
    
    // Show the popup with animation
    popup.style.display = 'block';
    overlay.style.display = 'block';
    
    // Trigger animations
    setTimeout(() => {
      popup.classList.add('active');
      overlay.classList.add('active');
    }, 10);
    
    // Determine file type from extension
    const fileExtension = filePath.split('.').pop().toLowerCase();
    
    // Add loading animation to terminal content
    contentDiv.innerHTML = "<div class='loading-terminal'>Loading content...</div>";
    contentDiv.style.display = 'block';
    iframe.style.display = 'none';
    
    // Simulate a short loading delay for effect
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (fileExtension === 'html') {
      // For HTML files, use iframe to display rendered content
      contentDiv.style.display = 'none';
      iframe.style.display = 'block';
      iframe.src = filePath;
      
      // Add typing animation for success message
      typeText(contentDiv, `Loading HTML file: ${filePath}... Success!`);
      
      // Add event listener to adjust iframe content
      iframe.onload = function() {
        try {
          // Apply styles to iframe content to make it fit
          const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
          const style = iframeDoc.createElement('style');
          style.textContent = `
            body {
              zoom: 0.9;
              overflow-x: hidden;
              max-width: 100%;
              box-sizing: border-box;
            }
            table {
              max-width: 100%;
              display: block;
              overflow-x: auto;
            }
            @media (max-width: 768px) {
              body {
                zoom: 0.8;
              }
            }
            @media (max-width: 480px) {
              body {
                zoom: 0.7;
              }
            }
          `;
          iframeDoc.head.appendChild(style);
        } catch (e) {
          console.error('Could not inject styles into iframe:', e);
        }
      };
    } 
    else if (fileExtension === 'xml') {
      // For XML files, check if they have an associated XSLT
      const response = await fetch(filePath);
      const xmlText = await response.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
      
      // Check for xml-stylesheet processing instruction
      let stylesheetHref = null;
      for (let i = 0; i < xmlDoc.childNodes.length; i++) {
        const node = xmlDoc.childNodes[i];
        if (node.nodeType === 7 && node.nodeName === 'xml-stylesheet') {
          const match = node.nodeValue.match(/href\s*=\s*["']([^"']+)["']/i);
          if (match) {
            stylesheetHref = match[1];
            break;
          }
        }
      }
      
      if (stylesheetHref) {
        // XML has associated XSLT - display rendered in iframe
        typeText(contentDiv, `Loading XML file with XSLT: ${filePath}\nApplying stylesheet: ${stylesheetHref}... Success!`);
        setTimeout(() => {
          contentDiv.style.display = 'none';
          iframe.style.display = 'block';
          iframe.src = filePath;
        }, 1000);
        
        // Add event listener to adjust iframe content
        iframe.onload = function() {
          try {
            // Apply styles to iframe content to make it fit
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            const style = iframeDoc.createElement('style');
            style.textContent = `
              body {
                zoom: 0.9;
                overflow-x: hidden;
                max-width: 100%;
                box-sizing: border-box;
              }
              table {
                max-width: 100%;
                display: block;
                overflow-x: auto;
              }
              @media (max-width: 768px) {
                body {
                  zoom: 0.8;
                }
              }
              @media (max-width: 480px) {
                body {
                  zoom: 0.7;
                }
              }
            `;
            iframeDoc.head.appendChild(style);
          } catch (e) {
            console.error('Could not inject styles into iframe:', e);
          }
        };
      } else {
        // XML without XSLT - show formatted XML
        contentDiv.style.display = 'block';
        iframe.style.display = 'none';
        
        const formattedXml = formatXml(xmlText);
        typeText(contentDiv, `Loading XML file: ${filePath}... Success!\n\n`);
        setTimeout(() => {
          contentDiv.innerHTML += `<div class="xml-formatted">${formattedXml}</div>`;
        }, 1000);
      }
    }
    else if (fileExtension === 'xsl' || fileExtension === 'xslt') {
      const response = await fetch(filePath);
      const xsltText = await response.text();
      const parser = new DOMParser();
      const xsltDoc = parser.parseFromString(xsltText, 'text/xml');
      
      contentDiv.style.display = 'block';
      iframe.style.display = 'none';
      
      if (xsltDoc.getElementsByTagName('parsererror').length > 0) {
        typeText(contentDiv, `Loading XSLT file: ${filePath}... Warning: Parse errors detected!\n\n`);
        setTimeout(() => {
          contentDiv.innerHTML += `<pre>${xsltText}</pre>`;
        }, 1000);
      } else {
        typeText(contentDiv, `Loading XSLT file: ${filePath}... Success!\n\n`);
        setTimeout(() => {
          const formattedXslt = formatXml(xsltText);
          contentDiv.innerHTML += `<div class="xml-formatted">${formattedXslt}</div>`;
        }, 1000);
      }
    }
    else {
      // For other files, show the raw content
      const response = await fetch(filePath);
      const content = await response.text();
      contentDiv.style.display = 'block';
      iframe.style.display = 'none';
      
      typeText(contentDiv, `Loading file: ${filePath}... Success!\n\n`);
      setTimeout(() => {
        contentDiv.innerHTML += `<pre>${content}</pre>`;
      }, 1000);
    }
  } catch (error) {
    console.error('Error loading file:', error);
    const contentDiv = document.getElementById('popupContent');
    const iframe = document.getElementById('popupIframe');
    
    contentDiv.style.display = 'block';
    iframe.style.display = 'none';
    
    typeText(contentDiv, `ERROR: Failed to load file.\nDetails: ${error.message}`);
  }
}

// Type text effect
function typeText(element, text, speed = 30) {
  element.textContent = ''; // Clear content
  
  let i = 0;
  const cursor = document.createElement('span');
  cursor.className = 'cursor';
  cursor.textContent = '▋';
  element.appendChild(cursor);
  
  function type() {
    if (i < text.length) {
      if (text.charAt(i) === '\n') {
        element.insertBefore(document.createElement('br'), cursor);
      } else {
        element.insertBefore(document.createTextNode(text.charAt(i)), cursor);
      }
      i++;
      setTimeout(type, speed);
    } else {
      // Add blinking effect to cursor
      cursor.style.animation = 'blink 1s step-end infinite';
    }
  }
  
  type();
}

// Close popup function
function closePopup() {
  const popup = document.getElementById('popup');
  const overlay = document.getElementById('overlay');
  
  popup.classList.add('closing');
  overlay.classList.remove('active');
  
  setTimeout(() => {
    popup.style.display = 'none';
    overlay.style.display = 'none';
    popup.classList.remove('active', 'closing');
  }, 300);
}

// Make terminal draggable
document.addEventListener('DOMContentLoaded', function() {
  const popup = document.getElementById('popup');
  const header = document.querySelector('.terminal-header');
  
  let isDragging = false;
  let offsetX, offsetY;
  
  header.addEventListener('mousedown', function(e) {
    isDragging = true;
    offsetX = e.clientX - popup.getBoundingClientRect().left;
    offsetY = e.clientY - popup.getBoundingClientRect().top;
    popup.style.transition = 'none';
  });
  
  document.addEventListener('mousemove', function(e) {
    if (!isDragging) return;
    
    const newX = e.clientX - offsetX;
    const newY = e.clientY - offsetY;
    
    popup.style.transform = `translate(0, 0)`;
    popup.style.top = `${newY}px`;
    popup.style.left = `${newX}px`;
  });
  
  document.addEventListener('mouseup', function() {
    isDragging = false;
    popup.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
  });
  
  // Update file links to use loadFileContent
  document.querySelectorAll('.file-link').forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      
      // Add clicked effect
      this.classList.add('clicking');
      setTimeout(() => {
        this.classList.remove('clicking');
      }, 300);
      
      loadFileContent(this.getAttribute('href'));
    });
  });
  
  // Handle keyboard navigation
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && popup.style.display === 'block') {
      closePopup();
    }
  });
  
  // Make file links more interactive
  document.querySelectorAll('.file-link').forEach(link => {
    // Add ripple effect on click
    link.addEventListener('click', function(e) {
      const ripple = document.createElement('span');
      ripple.classList.add('ripple');
      this.appendChild(ripple);
      
      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${e.clientX - rect.left - size/2}px`;
      ripple.style.top = `${e.clientY - rect.top - size/2}px`;
      
      ripple.classList.add('active');
      
      setTimeout(() => {
        ripple.remove();
      }, 500);
    });
  });
  
  // Close popup when clicking overlay
  document.getElementById('overlay').addEventListener('click', closePopup);
  
  // Add floating animations
  const container = document.querySelector('.container');
  
  // 3D Effect on container
  container.addEventListener('mousemove', function(e) {
    const { left, top, width, height } = this.getBoundingClientRect();
    const x = (e.clientX - left) / width;
    const y = (e.clientY - top) / height;
    
    const tiltX = (y - 0.5) * 10;
    const tiltY = (0.5 - x) * 10;
    
    this.querySelector('.glowing-border').style.transform = `rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
  });
  
  container.addEventListener('mouseleave', function() {
    this.querySelector('.glowing-border').style.transform = 'rotateX(0) rotateY(0)';
  });
});

// Function to format XML/XSLT with syntax highlighting
function formatXml(xml) {
  // Replace special characters to prevent HTML injection
  xml = xml.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  
  // Add indentation for readability
  let formatted = '';
  let indent = '';
  let indentSize = 2;
  
  // Split by > and process each part
  const parts = xml.split(/&gt;/);
  
  for (let i = 0; i < parts.length; i++) {
    let part = parts[i];
    
    if (part.trim() === '') continue;
    
    // Handle self-closing tags and comments
    if (part.indexOf('&lt;/') >= 0) {
      indent = ' '.repeat(Math.max(0, indent.length - indentSize));
      formatted += indent + '&lt;/' + part + '&gt;\n';
    }
    else if (part.indexOf('&lt;?') >= 0) {
      // XML declaration or processing instructions
      formatted += indent + '&lt;?' + part + '?&gt;\n';
    }
    else if (part.indexOf('&lt;!--') >= 0) {
      // Comments
      formatted += indent + '&lt;!--' + part.replace('&lt;!--', '') + '--&gt;\n';
    }
    else if (part.indexOf('/') === part.length - 1) {
      // Self-closing tag
      formatted += indent + '&lt;' + part + '&gt;\n';
    }
    else if (part.indexOf('&lt;') >= 0) {
      // Opening tag
      formatted += indent + '&lt;' + part + '&gt;\n';
      indent += ' '.repeat(indentSize);
    }
    else {
      // Content
      formatted += indent + part + '&gt;\n';
    }
  }
  
  // Apply syntax highlighting
  formatted = formatted
    // Highlight tags
    .replace(/&lt;(\/?[^\s&]+)([^&]*)&gt;/g, '&lt;<span class="xml-tag">$1</span>$2&gt;')
    // Highlight attributes
    .replace(/(\s+)([^\s=]+)(\s*=\s*"[^"]*")/g, '$1<span class="xml-attribute">$2</span>$3')
    // Highlight attribute values
    .replace(/=(\s*"[^"]*")/g, '=<span class="xml-value">$1</span>');
  
  return formatted;
} 