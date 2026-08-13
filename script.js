// ==========================================
// DOM ELEMENTS
// ==========================================
const calendarDays= document.getElementById("calendar-days");

const monthName= document.getElementById("month-name");
const yearDisplay= document.getElementById("year");

const prevMonthButton= document.getElementById("prev-month");
const nextMonthButton= document.getElementById("next-month");

const datepanel=document.getElementById("date-panel");
const selectedDateTitle=document.getElementById("selected-date-title");
const dateContent=document.getElementById("date-content");

const addTaskButton=document.getElementById("add-task-button");
const taskList=document.getElementById("task-list");

const taskInput=document.getElementById("task-input");
const taskCategory=document.getElementById("task-category");
const taskPriority=document.getElementById("task-priority");

const deadlinePanel = document.getElementById("deadline-panel");
const deadlineDate = document.getElementById("deadline-date");
const deadlineList = document.getElementById("deadline-list");


// ==========================================
// RETRO CURSOR SOUND
// Creates a tiny computer-like beep using JavaScript
// ==========================================

let audioContext = null;

function playCursorSound() {

    // Create audio system only when needed
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    // Resume audio if the browser suspended it
    if (audioContext.state === "suspended") {
        audioContext.resume();
    }

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    // Retro computer-like tone
    oscillator.type = "square";
    oscillator.frequency.setValueAtTime(
        700,
        audioContext.currentTime
    );

    // Very short volume envelope
    gainNode.gain.setValueAtTime(
        0.08,
        audioContext.currentTime
    );

    gainNode.gain.exponentialRampToValueAtTime(
        0.001,
        audioContext.currentTime + 0.07
    );

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.07);
}



// ==========================================
// CALENDAR STATE
// ==========================================
let currentDate= new Date();
let selectedDate= null;

// ==========================================
// TASK DATA
// Temporary in-memory task storage
// ==========================================
const tasks={};

let nextTaskId=1;

// ==========================================
// RENDER CALENDAR
// Generates all the days for the current month
// ==========================================
function renderCalendar() {
	calendarDays.innerHTML= "";
	
	const year= currentDate.getFullYear();
	const month= currentDate.getMonth();
	
	const firstDay= new Date(year, month, 1).getDay();
	const daysInMonth= new Date(year, month + 1, 0).getDate();
	
	monthName.textContent= currentDate.toLocaleString("default",{
		month:"long"
	});
	
	yearDisplay.textContent=year;
	
	//Create empty spaces before the first day
	for(let i=0;i<firstDay;i++){
		const emptyDay= document.createElement("div");
		emptyDay.classList.add("empty-day");
		calendarDays.appendChild(emptyDay);
	}
	
	//Generates each day of the month
	for(let day=1;day<=daysInMonth;day++){
		const dayElement=document.createElement("div");
		
		dayElement.classList.add("day");

		const dayNumber = document.createElement("span");
		dayNumber.textContent = day;
		dayElement.appendChild(dayNumber);

		// Pixel cursor corners
		const corners = ["top-left", "top-right", "bottom-left", "bottom-right"];

		corners.forEach(function(corner) {
			const cornerElement = document.createElement("span");
			cornerElement.classList.add("cursor-corner", corner);
			dayElement.appendChild(cornerElement);
		});
	
		//Show whether a date contains tasks 
		const datakey=new Date(
			year,
			month,
			day
		).toISOString().split("T")[0];
		
		if(tasks[datakey] && tasks[datakey].length>0) {
			dayElement.classList.add("has-tasks");
		}
		
		//Highlight today's date
		const today=new Date();
		
		if(
			day== today.getDate() &&
			month == today.getMonth() &&
			year == today.getFullYear()
		){
			dayElement.classList.add("today");
		}
		
		//Restore selected date after changing months
		if (
			selectedDate && 
			day == selectedDate.getDate() &&
			month == selectedDate.getMonth() &&
			year == selectedDate.getFullYear()
		){
			dayElement.classList.add("selected");
		}
		
		calendarDays.appendChild(dayElement);
	}
}

// ==========================================
// RENDER TASKS
// Displays tasks belonging to the selected date
// ==========================================
function renderTasks() {
	taskList.innerHTML="";
	
	if(!selectedDate) {
		return;
	}
	
	const dateKey=selectedDate.toISOString().split("T")[0];
	
	const dateTasks=tasks[dateKey] || [];
	
	//Show message when there are no tasks
	if(dateTasks.length == 0) {
		const emptyMessage=document.createElement("p");
		emptyMessage.textContent="No tasks for this date.";
		taskList.appendChild(emptyMessage);
		return;
	}
	
	//Generate each task
	dateTasks.forEach(function(task) {
		const taskElement= document.createElement("div");
		taskElement.classList.add("task");
		if(task.completed) {
			taskElement.classList.add("completed");
		}
		
		//Completion checkbox
		const checkbox=document.createElement("input");
		
		checkbox.type="checkbox";
		checkbox.checked=task.completed;
		
		checkbox.addEventListener("change",function() {
			task.completed=checkbox.checked;
			saveTasks();
			renderTasks();
			renderCalendar();
		});
		
		//Task title
		const title=document.createElement("span");
		title.textContent=task.title;
		
		//Category
		const category=document.createElement("span");
		category.textContent=task.category;
		category.classList.add("task-category");
		
		//Priority
		const priority=document.createElement("span");
		priority.textContent=task.priority;
		priority.classList.add("task-priority");
		
		//Edit button
		const editButton=document.createElement("button");
		editButton.textContent="Edit";
		editButton.addEventListener("click", function() {
			const newTitle=prompt("Edit task: ",task.title);
			
			if(!newTitle || newTitle.trim()===""){
				return;
			}
			task.title=newTitle.trim();
			saveTasks();
			renderTasks();
		});
		
		//Delete button
		const deleteButton=document.createElement("button");
		deleteButton.textContent="x";
		deleteButton.addEventListener("click", function() {
			const confirmed=confirm("Delete this task?");
			if(!confirmed) {
				return;
			}
			const taskIndex=dateTasks.indexOf(task);
			dateTasks.splice(taskIndex,1);
			saveTasks();
			renderTasks();
			renderCalendar();
		});
		//Add everything to task element
		taskElement.appendChild(checkbox);
		taskElement.appendChild(title);
		taskElement.appendChild(category);
		taskElement.appendChild(priority);
		taskElement.appendChild(editButton);
		taskElement.appendChild(deleteButton);
		
		taskList.appendChild(taskElement);
		
	});
}
		// ==========================================
		// RENDER DEADLINES
		// Displays deadlines for the selected date
		// ==========================================

		function renderDeadlines() {

			deadlineList.innerHTML = "";

			if (!selectedDate) {
				deadlineDate.textContent = "SELECT A DATE";

				const message = document.createElement("div");
				message.classList.add("no-deadlines");
				message.textContent = "> Select a date";

				deadlineList.appendChild(message);
				return;
		}

			const formattedDate = selectedDate.toLocaleString("en-US", {
				month: "short",
				day: "numeric",
				year: "numeric"
			});

			deadlineDate.textContent = formattedDate;

			const dateKey = selectedDate.toISOString().split("T")[0];

			const dateTasks = tasks[dateKey] || [];

			// Find tasks that have deadlines
		const deadlines = dateTasks.filter(function(task) {
				return task.deadline;
			});

			if (deadlines.length === 0) {

				const message = document.createElement("div");
				message.classList.add("no-deadlines");
				message.textContent = "> NO DEADLINES";

				deadlineList.appendChild(message);
				return;
			}

			deadlines.forEach(function(task) {

				const deadlineElement = document.createElement("div");
				deadlineElement.classList.add("deadline-item");

				const title = document.createElement("span");
			title.textContent = task.title;

				const time = document.createElement("span");
				time.textContent = task.deadline;

				deadlineElement.appendChild(title);
				deadlineElement.appendChild(time);

				deadlineList.appendChild(deadlineElement);
			});
		}
	

// ==========================================
// DATE SELECTION
// 	Handles clicks on individual calendar dates
// ==========================================
calendarDays.addEventListener("click", function(event){
	if(!event.target.classList.contains("day")){
		return;
	}
	
	const selectedDay = Number(event.target.textContent);
	
	selectedDate=new Date(
		currentDate.getFullYear(),
		currentDate.getMonth(),
		selectedDay
	);
	playCursorSound();
	
	//Remove selection of every other date
	const allDays=document.querySelectorAll(".day");
	
	allDays.forEach(function(day) {
		day.classList.remove("selected");
	});
	
	event.target.classList.add("selected");
	
	//Update the selected date panel
	const formattedDate=selectedDate.toLocaleString("en-US", {
		weekday: "long",
		month: "long",
		day: "numeric",
		year: "numeric"
	});
	
	selectedDateTitle.textContent= formattedDate;
	renderTasks();
	renderDeadlines();
});

// ==========================================
// ADD TASK
// Creates a task for the currently selected date
// ==========================================
addTaskButton.addEventListener("click",function() {
	if(!selectedDate){
		alert("Select a date first.");
		return;
	}
	
	const title= taskInput.value.trim();
	if(title === ""){
		return;
	}
	
	const dateKey=selectedDate.toISOString().split("T")[0];
	
	if(!tasks[dateKey]) {
		tasks[dateKey]=[];
    }
	
	const newTask= {
		id: nextTaskId,
		title: title,
		category: taskCategory.value,
		priority: taskPriority.value,
		deadline: null,
		completed: false
	};
	
	tasks[dateKey].push(newTask);
	nextTaskId++;
	saveTasks();
	
	//Clear the input after adding
	taskInput.value="";
	taskCategory.value="general";
	taskPriority.value="low";
	
	renderTasks();
	
	renderCalendar();
});

// ==========================================
// DATA PERSISTANCE
// Saves tasks to browser storage
// ==========================================
function saveTasks() {
	localStorage.setItem(
		"commandCentreTasks",
		JSON.stringify(tasks)
	);
}

function loadTasks() {
	const savedTasks=localStorage.getItem("commandCentreTasks");
	if(!savedTasks) {
		return;
	}
	
	const parsedTasks=JSON.parse(savedTasks);
	Object.assign(tasks, parsedTasks);
}

// ==========================================
// MONTH NAVIGATION
// Moves between previous and next months
// ==========================================
prevMonthButton.addEventListener("click", function() {
	currentDate.setMonth(currentDate.getMonth() -1);
	
	renderCalendar();
});

nextMonthButton.addEventListener("click", function() {
	currentDate.setMonth(currentDate.getMonth() +1);
	
	renderCalendar();
});

// ==========================================
// INITIAL RENDER
// Draw the calendar wehen the page first loads
// ==========================================
loadTasks();
renderCalendar();











// ==========================================
// KEYBOARD DATE NAVIGATION
// Arrow keys + WASD move the selected date
// ==========================================

document.addEventListener("keydown", function(event) {

    // Ignore keyboard navigation while typing in the task input
    if (event.target.tagName === "INPUT" ||
        event.target.tagName === "SELECT") {
        return;
    }

    // If no date has been selected yet, start from today
    if (!selectedDate) {
        selectedDate = new Date();
    }

    let newDate = new Date(selectedDate);

    // Move one day
    if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
        newDate.setDate(newDate.getDate() - 1);
    }

    if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
        newDate.setDate(newDate.getDate() + 1);
    }

    // Move one week
    if (event.key === "ArrowUp" || event.key.toLowerCase() === "w") {
        newDate.setDate(newDate.getDate() - 7);
    }

    if (event.key === "ArrowDown" || event.key.toLowerCase() === "s") {
        newDate.setDate(newDate.getDate() + 7);
    }

    // Update selected date
    selectedDate = newDate;
	playCursorSound();

    // If we moved into another month, update calendar
    if (
        newDate.getMonth() !== currentDate.getMonth() ||
        newDate.getFullYear() !== currentDate.getFullYear()
    ) {
        currentDate = new Date(
            newDate.getFullYear(),
            newDate.getMonth(),
            1
        );
    }

    // Update selected date information
    const formattedDate = selectedDate.toLocaleString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric"
    });

    selectedDateTitle.textContent = formattedDate;
	renderCalendar();
    renderTasks();
	renderDeadlines();
});





