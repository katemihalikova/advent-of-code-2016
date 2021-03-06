// == SHARED ==

class IntcodeComputer {
  constructor(memory) {
    this.memory = [...memory];
    this.input = [];
    this.output = [];
    this.pointer = 0;
    this.relBase = 0;
    this.instructions = this.getInstructions();
  }

  run(input) {
    this.input = this.input.concat(input === undefined ? [] : input);
    try {
      while (true) this.runNext();
    } catch (signal) {
      if (signal === "HALT" || signal === "NO_INPUT") {
        this.isHalted = signal === "HALT";
        let output = this.output;
        this.output = [];
        return output;
      }
      else throw signal;
    }
  }

  runNext() {
    let opcode = this.memory[this.pointer] % 100;
    this.instructions[opcode]();
  }

  getInstructions() {
    return {
      1: this.createInstruction(3, ({param, set}) => set(3, param(1) + param(2))),
      2: this.createInstruction(3, ({param, set}) => set(3, param(1) * param(2))),
      3: this.createInstruction(1, ({input, set}) => set(1, input())),
      4: this.createInstruction(1, ({param, output}) => output(param(1))),
      5: this.createInstruction(2, ({param, goto}) => param(1) && goto(param(2))),
      6: this.createInstruction(2, ({param, goto}) => param(1) || goto(param(2))),
      7: this.createInstruction(3, ({param, set}) => set(3, param(1) < param(2) ? 1 : 0)),
      8: this.createInstruction(3, ({param, set}) => set(3, param(1) === param(2) ? 1 : 0)),
      9: this.createInstruction(1, ({param, offset}) => offset(param(1))),
      99: this.createInstruction(1, ({halt}) => halt()),
    };
  }

  createInstruction(numberOfParams, handler) {
    return () => {
      let params = this.memory.slice(this.pointer + 1, this.pointer + numberOfParams + 1);
      let modes = [...Math.floor(this.memory[this.pointer] / 100).toString()].reverse().map(Number);
      let nextPointer = this.pointer + 1 + numberOfParams;
      handler({
        param: paramNr => {
          switch (modes[paramNr - 1]) {
            case 1: return params[paramNr - 1];
            case 2: return this.memory[params[paramNr - 1] + this.relBase] || 0;
            default: return this.memory[params[paramNr - 1]] || 0;
          }
        },
        set: (paramNr, value) => {
          switch (modes[paramNr - 1]) {
            case 2: return this.memory[params[paramNr - 1] + this.relBase] = value;
            default: return this.memory[params[paramNr - 1]] = value;
          }
        },
        halt: () => {throw "HALT"},
        goto: pointer => nextPointer = pointer,
        input: () => {
          if (this.input.length === 0) throw "NO_INPUT";
          return this.input.shift();
        },
        output: value => this.output.push(value),
        offset: value => this.relBase += value,
      });
      this.pointer = nextPointer;
    };
  }
}

class GridWalker {
  constructor(x = 0, y = 0, dir = "U") {
    this.x = x;
    this.y = y;
    this.dir = dir;
  }

  grid = {};

  read() {
    if (this.y in this.grid && this.x in this.grid[this.y]) {
      return this.grid[this.y][this.x];
    }
  }

  write(value) {
    this.grid[this.y] = this.grid[this.y] || {};
    this.grid[this.y][this.x] = value;
  }

  turnLeft() {
    this.dir = {"U":"L", "L":"D", "D":"R", "R":"U"}[this.dir];
  }

  turnRight() {
    this.dir = {"U":"R", "R":"D", "D":"L", "L":"U"}[this.dir];
  }

  moveForward() {
    if (this.dir === "U") this.y--;
    if (this.dir === "R") this.x++;
    if (this.dir === "D") this.y++;
    if (this.dir === "L") this.x--;
  }

  getNumberOfUsedCells() {
    return Object.values(this.grid).reduce((acc, row) => acc + Object.keys(row).length, 0);
  }

  getGridAsArray() {
    let ys = Object.keys(this.grid);
    let minY = Math.min(...ys);
    let maxY = Math.max(...ys);
    let xs = Object.values(this.grid).reduce((acc, row) => new Set([...acc, ...Object.keys(row)]), []);
    let minX = Math.min(...xs);
    let maxX = Math.max(...xs);

    let gridAsArray = [];
    for (let y = minY; y <= maxY; y++) {
      let rowAsArray = [];
      for (let x = minX; x <= maxX; x++) {
        if (y in this.grid && x in this.grid[y]) {
          rowAsArray.push(this.grid[y][x]);
        } else {
          rowAsArray.push(undefined);
        }
      }
      gridAsArray.push(rowAsArray);
    }
    return gridAsArray;
  }
}

// == PART 1 ==

function part1(program) {
  program = program.split(",").map(Number);

  let computer = new IntcodeComputer(program);
  let grid = new GridWalker();

  while(!computer.isHalted) {
    let color = grid.read() || 0;

    let [newColor, directionChange] = computer.run(color);

    if (directionChange === 0) {
      grid.turnLeft();
    } else {
      grid.turnRight();
    }

    grid.write(newColor);
    grid.moveForward();
  }

  return grid.getNumberOfUsedCells();
}

// == PART 2 ==

function part2(program) {
  program = program.split(",").map(Number);

  let computer = new IntcodeComputer(program);
  let grid = new GridWalker();
  grid.write(1);

  while(!computer.isHalted) {
    let color = grid.read() || 0;

    let [newColor, directionChange] = computer.run(color);

    if (directionChange === 0) {
      grid.turnLeft();
    } else {
      grid.turnRight();
    }

    grid.write(newColor);
    grid.moveForward();
  }

  return grid.getGridAsArray().map(line => line.map(color => color === 1 ? "█" : color === 0 ? "░" : " ").join("")).join("\n");
}

// == ASSERTS ==

// no runnable examples today
