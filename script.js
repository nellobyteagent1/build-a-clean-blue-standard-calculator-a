(function () {
  const display = document.getElementById('display');
  const expression = document.getElementById('expression');

  let current = '0';
  let previous = null;
  let operator = null;
  let shouldReset = false;
  let lastEquals = null; // { operator, operand } for repeat-equals

  function formatNumber(n) {
    if (n === 'Error') return 'Error';
    const num = parseFloat(n);
    if (!isFinite(num)) return 'Error';
    // If the string has a trailing dot or trailing zeros after dot, preserve as-is
    if (typeof n === 'string' && (n.includes('.') && (n.endsWith('.') || /\.\d*0+$/.test(n)))) {
      return n;
    }
    // Format with commas but preserve decimal precision
    const parts = num.toString().split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  }

  function updateDisplay() {
    display.textContent = formatNumber(current);
  }

  function getOperatorSymbol(op) {
    const symbols = { add: '+', subtract: '\u2212', multiply: '\u00D7', divide: '\u00F7' };
    return symbols[op] || op;
  }

  function updateExpression() {
    if (previous !== null && operator) {
      expression.textContent = formatNumber(previous) + ' ' + getOperatorSymbol(operator);
    } else {
      expression.textContent = '';
    }
  }

  function calculate(a, op, b) {
    a = parseFloat(a);
    b = parseFloat(b);
    if (!isFinite(a) || !isFinite(b)) return 'Error';
    let result;
    switch (op) {
      case 'add': result = a + b; break;
      case 'subtract': result = a - b; break;
      case 'multiply': result = a * b; break;
      case 'divide':
        if (b === 0) return 'Error';
        result = a / b;
        break;
      default: return 'Error';
    }
    if (!isFinite(result)) return 'Error';
    // Round to avoid floating point artifacts (12 significant digits)
    return parseFloat(result.toPrecision(12)).toString();
  }

  function inputDigit(d) {
    if (current === 'Error') current = '0';
    if (shouldReset) {
      current = d;
      shouldReset = false;
    } else if (current === '0' && d !== '0') {
      current = d;
    } else if (current === '0' && d === '0') {
      // stay at 0
    } else {
      if (current.replace(/[^0-9]/g, '').length >= 15) return; // max digits
      current = current + d;
    }
    lastEquals = null;
    updateDisplay();
  }

  function inputDecimal() {
    if (current === 'Error') current = '0';
    if (shouldReset) {
      current = '0.';
      shouldReset = false;
    } else if (!current.includes('.')) {
      current = current + '.';
    }
    lastEquals = null;
    updateDisplay();
  }

  function inputOperator(op) {
    if (current === 'Error') return;
    lastEquals = null;

    if (previous !== null && operator && !shouldReset) {
      // Chain: evaluate pending operation first
      const result = calculate(previous, operator, current);
      current = result;
      updateDisplay();
      if (result === 'Error') {
        clear();
        current = 'Error';
        updateDisplay();
        return;
      }
    }

    previous = current;
    operator = op;
    shouldReset = true;
    updateExpression();

    // Highlight active operator button
    document.querySelectorAll('.btn.op').forEach(b => b.classList.remove('active'));
    const btn = document.querySelector('[data-action="' + op + '"]');
    if (btn) btn.classList.add('active');
  }

  function inputEquals() {
    if (current === 'Error') return;

    if (lastEquals && previous === null) {
      // Repeat last operation
      const result = calculate(current, lastEquals.operator, lastEquals.operand);
      expression.textContent = formatNumber(current) + ' ' + getOperatorSymbol(lastEquals.operator) + ' ' + formatNumber(lastEquals.operand) + ' =';
      current = result;
      updateDisplay();
      return;
    }

    if (previous === null || !operator) return;

    const operand = current;
    const result = calculate(previous, operator, current);

    expression.textContent = formatNumber(previous) + ' ' + getOperatorSymbol(operator) + ' ' + formatNumber(operand) + ' =';

    lastEquals = { operator: operator, operand: operand };
    current = result;
    previous = null;
    operator = null;
    shouldReset = true;
    updateDisplay();

    document.querySelectorAll('.btn.op').forEach(b => b.classList.remove('active'));
  }

  function inputPercent() {
    if (current === 'Error') return;
    const val = parseFloat(current);
    if (!isFinite(val)) return;

    if (previous !== null && operator) {
      // e.g., 200 + 10% = 200 + 20 = 220
      current = (parseFloat(previous) * val / 100).toString();
    } else {
      current = (val / 100).toString();
    }
    updateDisplay();
  }

  function backspace() {
    if (current === 'Error' || shouldReset) {
      current = '0';
      shouldReset = false;
    } else if (current.length <= 1 || (current.length === 2 && current.startsWith('-'))) {
      current = '0';
    } else {
      current = current.slice(0, -1);
    }
    updateDisplay();
  }

  function clear() {
    current = '0';
    previous = null;
    operator = null;
    shouldReset = false;
    lastEquals = null;
    updateDisplay();
    updateExpression();
    document.querySelectorAll('.btn.op').forEach(b => b.classList.remove('active'));
  }

  function handleAction(action) {
    if (action >= '0' && action <= '9') {
      inputDigit(action);
      // Clear operator highlight when typing new number
      if (!shouldReset) {
        document.querySelectorAll('.btn.op').forEach(b => b.classList.remove('active'));
      }
    } else if (action === 'decimal') {
      inputDecimal();
    } else if (action === 'add' || action === 'subtract' || action === 'multiply' || action === 'divide') {
      inputOperator(action);
    } else if (action === 'equals') {
      inputEquals();
    } else if (action === 'percent') {
      inputPercent();
    } else if (action === 'backspace') {
      backspace();
    } else if (action === 'clear') {
      clear();
    }
  }

  // Button clicks
  document.querySelectorAll('.btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      handleAction(this.dataset.action);
    });
  });

  // Keyboard support
  document.addEventListener('keydown', function (e) {
    const keyMap = {
      '0': '0', '1': '1', '2': '2', '3': '3', '4': '4',
      '5': '5', '6': '6', '7': '7', '8': '8', '9': '9',
      '.': 'decimal', ',': 'decimal',
      '+': 'add', '-': 'subtract', '*': 'multiply', '/': 'divide',
      'Enter': 'equals', '=': 'equals',
      'Backspace': 'backspace', 'Delete': 'clear',
      'Escape': 'clear', '%': 'percent'
    };

    const action = keyMap[e.key];
    if (action) {
      e.preventDefault();
      handleAction(action);

      // Visual feedback for key press
      const btn = document.querySelector('[data-action="' + action + '"]');
      if (btn) {
        btn.classList.add('active');
        setTimeout(function () {
          // Don't remove active from operator buttons mid-operation
          if (!['add', 'subtract', 'multiply', 'divide'].includes(action) || !operator) {
            btn.classList.remove('active');
          }
        }, 120);
      }
    }
  });

  updateDisplay();
})();
