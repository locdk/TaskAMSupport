const API_URL = 'http://localhost:3000';

const handleResponse = async (res) => {
    if (!res.ok) {
        let errorMsg;
        const resClone = res.clone();
        try {
            const errorData = await res.json();
            errorMsg = errorData.message || res.statusText;
        } catch (e) {
            try {
                errorMsg = await resClone.text() || res.statusText;
            } catch (textErr) {
                errorMsg = res.statusText;
            }
        }
        throw new Error(errorMsg);
    }
    return res.json();
};

export const api = {
    // Settings
    getSettings: async () => {
        const res = await fetch(`${API_URL}/settings`);
        return handleResponse(res);
    },
    updateSettings: async (settings) => {
        const res = await fetch(`${API_URL}/settings`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settings)
        });
        return handleResponse(res);
    },

    // Personnel
    getPersonnel: async () => {
        const res = await fetch(`${API_URL}/personnel`);
        return handleResponse(res);
    },
    addPersonnel: async (person) => {
        const res = await fetch(`${API_URL}/personnel`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(person)
        });
        return handleResponse(res);
    },
    deletePersonnel: async (id) => {
        const res = await fetch(`${API_URL}/personnel/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error(res.statusText);
        return id;
    },
    updatePersonnel: async (id, updates) => {
        const res = await fetch(`${API_URL}/personnel/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
        return handleResponse(res);
    },

    // Tasks
    getTasks: async () => {
        const res = await fetch(`${API_URL}/tasks`);
        return handleResponse(res);
    },
    addTask: async (task) => {
        const res = await fetch(`${API_URL}/tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(task)
        });
        return handleResponse(res);
    },
    updateTask: async (id, updates) => {
        const res = await fetch(`${API_URL}/tasks/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
        return handleResponse(res);
    },
    deleteTask: async (id) => {
        const res = await fetch(`${API_URL}/tasks/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error(res.statusText);
        return id;
    },

    // Notifications
    getNotifications: async () => {
        const res = await fetch(`${API_URL}/notifications`);
        return handleResponse(res);
    },
    addNotification: async (notif) => {
        const res = await fetch(`${API_URL}/notifications`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(notif)
        });
        return handleResponse(res);
    },
    updateNotification: async (id, updates) => {
        const res = await fetch(`${API_URL}/notifications/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
        return handleResponse(res);
    },

    // Attendance
    getAttendance: async () => {
        const res = await fetch(`${API_URL}/attendance`);
        if (!res.ok) return [];
        return res.json();
    },
    addAttendance: async (record) => {
        const res = await fetch(`${API_URL}/attendance`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(record)
        });
        return handleResponse(res);
    },
    updateAttendance: async (id, updates) => {
        const res = await fetch(`${API_URL}/attendance/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
        return handleResponse(res);
    },

    // Attendance History
    getAttendanceHistory: async () => {
        const res = await fetch(`${API_URL}/attendanceHistory`);
        if (!res.ok) return [];
        return res.json();
    },
    addAttendanceHistory: async (record) => {
        const res = await fetch(`${API_URL}/attendanceHistory`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(record)
        });
        return handleResponse(res);
    },

    // Task Configuration
    getTaskStatuses: async () => {
        const res = await fetch(`${API_URL}/taskStatuses`);
        if (!res.ok) return [];
        return res.json();
    },
    updateTaskStatus: async (item) => fetch(`${API_URL}/taskStatuses/${item.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item) }).then(handleResponse),
    addTaskStatus: async (item) => fetch(`${API_URL}/taskStatuses`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item) }).then(handleResponse),
    deleteTaskStatus: async (id) => fetch(`${API_URL}/taskStatuses/${id}`, { method: 'DELETE' }).then(res => res.ok ? id : handleResponse(res)),

    getTaskPriorities: async () => {
        const res = await fetch(`${API_URL}/taskPriorities`);
        if (!res.ok) return [];
        return res.json();
    },
    updateTaskPriority: async (item) => fetch(`${API_URL}/taskPriorities/${item.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item) }).then(handleResponse),
    addTaskPriority: async (item) => fetch(`${API_URL}/taskPriorities`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item) }).then(handleResponse),
    deleteTaskPriority: async (id) => fetch(`${API_URL}/taskPriorities/${id}`, { method: 'DELETE' }).then(res => res.ok ? id : handleResponse(res)),

    getTaskTypes: async () => {
        const res = await fetch(`${API_URL}/taskTypes`);
        if (!res.ok) return [];
        return res.json();
    },
    updateTaskType: async (item) => fetch(`${API_URL}/taskTypes/${item.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item) }).then(handleResponse),
    addTaskType: async (item) => fetch(`${API_URL}/taskTypes`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item) }).then(handleResponse),
    deleteTaskType: async (id) => fetch(`${API_URL}/taskTypes/${id}`, { method: 'DELETE' }).then(res => res.ok ? id : handleResponse(res)),

    getDesignTaskTypes: async () => {
        const res = await fetch(`${API_URL}/designTaskTypes`);
        if (!res.ok) return [];
        return res.json();
    },
    updateDesignTaskType: async (item) => fetch(`${API_URL}/designTaskTypes/${item.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item) }).then(handleResponse),
    addDesignTaskType: async (item) => fetch(`${API_URL}/designTaskTypes`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item) }).then(handleResponse),
    deleteDesignTaskType: async (id) => fetch(`${API_URL}/designTaskTypes/${id}`, { method: 'DELETE' }).then(res => res.ok ? id : handleResponse(res)),

    // Teams
    getTeams: async () => {
        const res = await fetch(`${API_URL}/teams`);
        if (!res.ok) return [];
        return res.json();
    },
    updateTeam: async (item) => fetch(`${API_URL}/teams/${item.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item) }).then(handleResponse),
    addTeam: async (item) => fetch(`${API_URL}/teams`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item) }).then(handleResponse),
    deleteTeam: async (id) => fetch(`${API_URL}/teams/${id}`, { method: 'DELETE' }).then(res => res.ok ? id : handleResponse(res)),

    // Roles
    getRoles: async () => {
        const res = await fetch(`${API_URL}/roles`);
        if (!res.ok) return [];
        return res.json();
    },
    updateRole: async (item) => fetch(`${API_URL}/roles/${item.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item) }).then(handleResponse),
    addRole: async (item) => fetch(`${API_URL}/roles`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item) }).then(handleResponse),
    deleteRole: async (id) => fetch(`${API_URL}/roles/${id}`, { method: 'DELETE' }).then(res => res.ok ? id : handleResponse(res)),
};
