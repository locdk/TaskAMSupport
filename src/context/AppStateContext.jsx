import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import * as firestoreAPI from '../services/firestoreAPI';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';

const AppStateContext = createContext();

// Fallback shift definitions (used if database is empty)
const DEFAULT_SHIFT_DEFINITIONS = {
    'S1': { start: '21:00' },
    'S2': { start: '22:00' },
    'S3': { start: '23:00' },
    'Ca 1': { start: '09:00' },
    'Ca 2': { start: '10:00' },
    'Ca 3': { start: '11:00' },
};

const MOTIVATIONAL_QUOTES = [
    "Sự kiên trì là chìa khóa của thành công.",
    "Làm việc chăm chỉ đánh bại tài năng khi tài năng không làm việc chăm chỉ.",
    "Thành công không phải là cuối cùng, thất bại không phải là tử vong: đó là lòng can đảm để tiếp tục mới quan trọng.",
    "Đừng đợi cơ hội. Hãy tự tạo ra nó.",
    "Khó khăn không phải để dừng lại, mà là để rèn luyện chúng ta.",
    "Mọi giấc mơ đều có thể trở thành sự thật nếu chúng ta có đủ can đứng để theo đuổi chúng.",
    "Cách duy nhất để làm được điều vĩ đại là yêu việc bạn làm.",
    "Hãy làm việc khi người khác còn đang ngủ. Học hỏi khi người khác còn đang chơi.",
    "Bắt đầu từ nơi bạn đứng. Sử dụng những gì bạn có. Làm những gì bạn có thể.",
    "Hôm nay bạn làm những gì người khác không làm, ngày mai bạn sẽ có những gì người khác không có.",
    "Thành công bắt đầu từ sự chuẩn bị và nỗ lực không ngừng.",
    "Hãy là phiên bản tốt nhất của chính mình ngày hôm nay.",
    "Mọi rào cản chỉ là thử thách để bạn mạnh mẽ hơn.",
    "Đừng so sánh mình với người khác, hãy so sánh với chính mình của ngày hôm qua.",
    "Lòng quyết tâm chính là năng lượng để biến giấc mơ thành hiện thực.",
    "Mục tiêu của bạn không nên là trở nên giỏi hơn người khác. Mục tiêu của bạn nên là trở nên tốt hơn con người của chính bạn ngày hôm qua.",
    "Thành công là tổng của những nỗ lực nhỏ, lặp đi lặp lại ngày qua ngày.",
    "Đừng bao giờ từ bỏ ước mơ chỉ vì mất quá nhiều thời gian để thực hiện nó. Thời gian vẫn sẽ trôi đi thôi.",
    "Nghị lực và sự kiên trì sẽ chiến thắng mọi thứ.",
    "Hãy tin rằng bạn có thể và bạn đã đi được nửa chặng đường rồi.",
    "Hành động là chìa khóa nền tảng cho mọi thành công.",
    "Thất bại là cơ hội để bắt đầu lại một cách thông minh hơn.",
    "Giới hạn duy nhất cho những thành tựu ngày mai là những nghi ngờ của chúng ta ngày hôm nay.",
    "Người duy nhất bạn nên cố gắng để trở nên tốt hơn chính là bản thân bạn của ngày hôm qua.",
    "Mọi thứ dường như là không thể cho đến khi nó được hoàn thành.",
    "Sự khác biệt giữa người thành công và những người khác không phải là thiếu sức mạnh hay thiếu hiểu biết, mà là thiếu ý chí.",
    "Kỷ luật là cầu nối giữa mục tiêu và thành tựu.",
    "Thành công không đến với những người chỉ biết hy vọng, nó đến với những người không bao giờ bỏ cuộc.",
    "Đừng cầu nguyện cho cuộc sống dễ dàng hơn, hãy cầu nguyện để bản thân mạnh mẽ hơn.",
    "Mỗi ngày là một cơ hội mới để thay đổi cuộc sống của bạn.",
    "Thái độ của bạn định hình tương lai của bạn.",
    "Nghĩ lớn, bắt đầu nhỏ, hành động ngay bây giờ.",
    "Sự nhiệt huyết là mẹ của nỗ lực, và không có nó, không có gì vĩ đại từng được hoàn thành.",
    "Học hỏi từ ngày hôm qua, sống cho ngày hôm nay, hy vọng cho ngày mai.",
    "Thành tựu vĩ đại nhất không phải là không bao giờ vấp ngã, mà là đứng dậy sau mỗi lần ngã.",
    "Đừng sợ thất bại. Hãy sợ việc không thử sức.",
    "Nếu bạn muốn đạt được điều gì đó chưa từng có, bạn phải làm những việc chưa từng làm.",
    "Hạnh phúc không phải là điểm đến, mà là hành trình chúng ta đang đi.",
    "Mọi khó khăn đều là một nấc thang để bước lên cao hơn.",
    "Đam mê là nguồn năng lượng. Hãy cảm nhận sức mạnh đến từ việc tập trung vào những gì khiến bạn hào hứng.",
    "Bí mật của việc tiến về phía trước là bắt đầu.",
    "Những giấc mơ không tự nhiên thành hiện thực, chúng cần mồ hôi, quyết tâm và làm việc chăm chỉ.",
    "Càng làm việc chăm chỉ, tôi càng cảm thấy mình may mắn.",
    "Đừng bị phân tâm bởi những gì bạn không thể làm. Hãy tập trung vào những gì bạn có thể.",
    "Giá trị của bạn không nằm ở những gì bạn có, mà ở những gì bạn cống hiến.",
    "Tương lai thuộc về những người tin vào vẻ đẹp của giấc mơ.",
    "Đôi khi bạn phải trải qua những ngày tồi tệ nhất để đi đến những ngày tốt đẹp nhất.",
    "Sáng tạo là thông minh và vui vẻ.",
    "Kiên nhẫn là đắng chát, nhưng quả của nó lại ngọt ngào.",
    "Hãy dũng cảm để sống cuộc đời mà bạn hằng mong ước.",
    "Thành công không đo bằng vị trí bạn đạt được, mà bằng những trở ngại bạn đã vượt qua.",
    "Tự tin là chìa khóa đầu tiên của sự thành công.",
    "Hãy luôn giữ vững niềm tin, vì cuối con đường hầm luôn có ánh sáng.",
    "Sức mạnh không đến từ thể chất, nó đến từ ý chí bất khuất.",
    "Mỗi bước đi nhỏ đều đưa bạn đến gần hơn với mục tiêu lớn.",
    "Đừng để thế giới thay đổi nụ cười của bạn, hãy để nụ cười của bạn thay đổi thế giới.",
    "Cuộc sống là 10% những gì xảy ra với bạn và 90% cách bạn phản ứng với nó.",
    "Hãy là lý do khiến ai đó tin vào lòng tốt của con người ngày hôm nay.",
    "Sự thay đổi bắt đầu từ chính bạn.",
    "Đừng đếm ngày, hãy làm sao để những ngày đều đáng đếm.",
    "Không bao giờ là quá muộn để bắt đầu lại.",
    "Cái giá của sự vĩ đại chính là trách nhiệm.",
    "Hãy làm những gì bạn có thể, với những gì bạn có, ở nơi bạn đang đứng.",
    "Rủi ro lớn nhất là không dám chấp nhận rủi ro nào.",
    "Sự tập trung là nguồn gốc của mọi thành công.",
    "Đừng chờ đợi sự hoàn hảo, hãy bắt đầu ngay hôm nay và cải thiện dần dần.",
    "Người thành công luôn tìm thấy cơ hội trong khó khăn.",
    "Hãy tin vào tiềm năng vô hạn của bản thân.",
    "Làm việc vì đam mê, thành công sẽ tự tìm đến.",
    "Mỗi sai lầm đều là một bài học quý giá.",
    "Kiên trì là con đường ngắn nhất dẫn đến thành công.",
    "Đừng nhìn lại phía sau, trừ khi đó là để học hỏi.",
    "Hãy sống sao cho mỗi ngày đều là một kiệt tác.",
    "Thành công là khi bạn gặp chuẩn bị với cơ hội.",
    "Hãy gieo nỗ lực, bạn sẽ gặt hái thành công.",
    "Tâm thế tích cực sẽ dẫn đến kết quả tích cực.",
    "Đừng để những ý kiến tiêu cực ngăn cản bạn.",
    "Hãy tập trung vào quá trình, kết quả sẽ tự chăm sóc chính nó.",
    "Không gì là không thể với một người luôn cố gắng.",
    "Lòng biết ơn là nấc thang dẫn đến hạnh phúc.",
    "Hãy sẵn sàng thay đổi để trở nên tốt hơn.",
    "Sự khiêm tốn là dấu hiệu của người thực sự vĩ đại.",
    "Đừng quên chăm sóc bản thân trên hành trình chinh phục giấc mơ.",
    "Hãy luôn học hỏi và phát triển không ngừng.",
    "Tổ chức tốt là nền tảng của hiệu suất cao.",
    "Làm việc nhóm làm cho giấc mơ thành hiện thực.",
    "Mỗi đóng góp nhỏ đều tạo nên sự khác biệt lớn.",
    "Hãy trân trọng từng khoảnh khắc hiện tại.",
    "Sự sáng tạo không có giới hạn.",
    "Hãy biến khó khăn thành động lực.",
    "Đừng bao giờ đánh mất sự tò mò.",
    "Sự trung thực là chính sách tốt nhất.",
    "Hãy cam kết với sự xuất sắc.",
    "Kiên định với mục tiêu, linh hoạt với phương pháp.",
    "Hãy luôn giữ cho tâm trí mình rộng mở.",
    "Thành công thật sự là khi bạn giúp người khác thành công.",
    "Hãy tin vào sức mạnh của sự tử tế.",
    "Mọi hành trình vạn dặm đều bắt đầu từ một bước chân lẻ loi.",
    "Hãy luôn khao khát, hãy luôn dại khờ.",
    "Bản lĩnh là không bao giờ lùi bước trước khó khăn."
];

const getShiftStartTime = (shiftCode, user, shiftDefinitions = []) => {
    if (!shiftCode || shiftCode === '-' || shiftCode === 'Nghỉ') return null;

    // Special case for Jerry on S3
    if (shiftCode.startsWith('S3') && user?.name === 'Jerry') {
        return { start: '22:00' };
    }

    // Try to find shift in database definitions first
    const dbShift = shiftDefinitions.find(s => s.name === shiftCode);
    if (dbShift && dbShift.startTime) {
        return { start: dbShift.startTime };
    }

    // Fallback to default definitions
    return DEFAULT_SHIFT_DEFINITIONS[shiftCode] || null;
};



const calculateLateMinutes = (loginTime, shiftTimes) => {
    const [shiftHour, shiftMin] = shiftTimes.start.split(':').map(Number);
    const shiftStart = new Date(loginTime);
    shiftStart.setHours(shiftHour, shiftMin, 0, 0);

    // 12-hour threshold logic:
    // If shiftStart (Today) is more than 12 hours in the future compared to loginTime,
    // it means the person is logging in for a night shift that started YESTERDAY.
    // Example: Login 01:00, Shift 21:00. ShiftStart(Today) - Login = 20 hours. 
    // ShiftStart should be Yesterday 21:00.
    if (shiftStart.getTime() - loginTime.getTime() > 12 * 60 * 60 * 1000) {
        shiftStart.setDate(shiftStart.getDate() - 1);
    }
    // Conversely, if login is more than 12 hours after shiftStart (Today),
    // it's possible it's a login for a different session, but for late calculation,
    // we assume the closest relevant shift start. No action needed as diff will be positive.

    const diffMs = loginTime - shiftStart;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    // If diff is negative (arrived early), return 0.
    return diffMinutes > 0 ? diffMinutes : 0;
};

// Check if login time is within the check-in window (N minutes before/after shift start)
const isWithinCheckInWindow = (shiftStartTimeStr, loginTime, shiftDefinitions = [], user = null, windowMinutes = 90) => {
    if (!shiftStartTimeStr) return false;

    const shiftTimes = getShiftStartTime(shiftStartTimeStr, user, shiftDefinitions);
    if (!shiftTimes || !shiftTimes.start) return false;

    const [shiftHour, shiftMin] = shiftTimes.start.split(':').map(Number);
    const shiftStart = new Date(loginTime);
    shiftStart.setHours(shiftHour, shiftMin, 0, 0);

    // Night shift correction: if shift start is >12h in the future, it was yesterday's shift
    if (shiftStart.getTime() - loginTime.getTime() > 12 * 60 * 60 * 1000) {
        shiftStart.setDate(shiftStart.getDate() - 1);
    }
    // If shift start is >12h in the past, it might be tomorrow's shift
    if (loginTime.getTime() - shiftStart.getTime() > 12 * 60 * 60 * 1000) {
        shiftStart.setDate(shiftStart.getDate() + 1);
    }

    const diffMs = loginTime.getTime() - shiftStart.getTime();
    const diffMinutes = diffMs / (1000 * 60);

    // Login is within window: from (windowMinutes before shift) to (windowMinutes after shift)
    return diffMinutes >= -windowMinutes && diffMinutes <= windowMinutes;
};

const isTaskDueToday = (deadline) => {
    if (!deadline) return false;
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Handle dd/mm/yyyy format
    if (deadline.includes('/')) {
        const [day, month, year] = deadline.split('/');
        const deadlineStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        return deadlineStr === todayStr;
    }

    // Handle ISO format
    return deadline.startsWith(todayStr);
};

export const AppStateProvider = ({ children }) => {
    // 1. Organization Settings
    const [settings, setSettings] = useState(() => {
        const localTheme = localStorage.getItem('theme');
        const isDark = localTheme ? localTheme === 'dark' : true;

        return {
            brandName: 'MAC USA ONE',
            logo: null,
            isDarkMode: isDark,
            notifications: true,
            primaryColor: '#1890ff',
            telegramBotToken: '',
            telegramChatId: '',
            enableAmAttendance: false
        };
    });
    const [isLoading, setIsLoading] = useState(true);

    // 0. User Session
    const [user, setUser] = useState(() => {
        try {
            const saved = localStorage.getItem('currentUser');
            return saved ? JSON.parse(saved) : null;
        } catch (e) {
            return null;
        }
    });

    // Initialize loading state on mount
    useEffect(() => {
        // If no user in localStorage, we're not loading anymore
        if (!user) {
            setIsLoading(false);
        }
    }, []);

    // Load organization settings on mount (even before login)
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const settingsData = await firestoreAPI.getSettings();
                if (settingsData && settingsData.length > 0) {
                    // Exclude isDarkMode to respect local preference
                    const { isDarkMode, ...serverData } = settingsData[0];
                    setSettings(prev => ({ ...prev, ...serverData }));
                }
            } catch (error) {
                console.error('Failed to load settings:', error);
            }
        };
        loadSettings();
    }, []);

    // 2. Personnel Data
    const [personnel, setPersonnel] = useState([]);

    // 3. Tasks Data
    const [tasks, setTasks] = useState([]);

    // 4. Notifications Data
    const [notifications, setNotifications] = useState([]);

    // 5. Attendance Data
    const [attendance, setAttendance] = useState([]);
    const [attendanceHistory, setAttendanceHistory] = useState([]);

    // 6. Task Configuration Data
    const [taskStatuses, setTaskStatuses] = useState([]);
    const [taskPriorities, setTaskPriorities] = useState([]);
    const [taskTypes, setTaskTypes] = useState([]);
    const [teams, setTeams] = useState([]);
    const [roles, setRoles] = useState([]);
    const [knowledgeCategories, setKnowledgeCategories] = useState([]); // 8. Knowledge Categories
    const [designTaskTypes, setDesignTaskTypes] = useState([]);
    const [shiftDefinitions, setShiftDefinitions] = useState([]);
    const [toast, setToast] = useState(null);
    const [welcomeModal, setWelcomeModal] = useState(null); // Welcome modal state
    const [newKnowledgeModal, setNewKnowledgeModal] = useState(null); // New knowledge notification modal
    const lastNotifIdRef = useRef(null);
    const [knowledge, setKnowledge] = useState([]); // 7. Knowledge Base Data
    const [stores, setStores] = useState([]); // 9. Stores Data
    const [storeLogs, setStoreLogs] = useState([]); // 10. Store Edit Logs

    // Load initial data and setup polling
    // Load initial config data (Static/Rarely changed)
    const fetchAllData = async () => {
        try {
            const [statusRes, prioRes, typeRes, teamsRes, rolesRes, designTypeRes, shiftRes, historyRes, knowledgeCatRes] = await Promise.all([
                firestoreAPI.getTaskStatuses(),
                firestoreAPI.getTaskPriorities(),
                firestoreAPI.getTaskTypes(),
                firestoreAPI.getTeams(),
                firestoreAPI.getRoles(),
                firestoreAPI.getDesignTaskTypes(),
                firestoreAPI.getShiftDefinitions(),
                firestoreAPI.getAttendanceHistory(),
                firestoreAPI.getKnowledgeCategories()
            ]);

            if (statusRes) setTaskStatuses([...statusRes].sort((a, b) => (a.order || 0) - (b.order || 0)));
            if (prioRes) setTaskPriorities([...prioRes].sort((a, b) => (a.order || 0) - (b.order || 0)));
            if (typeRes) setTaskTypes([...typeRes].sort((a, b) => (a.order || 0) - (b.order || 0)));
            if (teamsRes) setTeams([...teamsRes].sort((a, b) => (a.order || 0) - (b.order || 0)));
            if (rolesRes) setRoles([...rolesRes].sort((a, b) => (a.order || 0) - (b.order || 0)));
            if (knowledgeCatRes) setKnowledgeCategories([...knowledgeCatRes].sort((a, b) => (a.order || 0) - (b.order || 0)));
            if (designTypeRes) setDesignTaskTypes([...designTypeRes].sort((a, b) => (a.order || 0) - (b.order || 0)));
            if (shiftRes) setShiftDefinitions([...shiftRes].sort((a, b) => (a.order || 0) - (b.order || 0)));
            if (historyRes) {
                const getTs = (item) => {
                    const t = item.timestamp;
                    if (!t) return 0;
                    if (t.toMillis) return t.toMillis();
                    if (t.seconds) return t.seconds * 1000;
                    return new Date(t).getTime() || 0;
                };
                setAttendanceHistory([...historyRes].sort((a, b) => getTs(b) - getTs(a)));
            }

            // Fetch initial store logs
            const storeLogsRes = await firestoreAPI.getStoreLogs();
            if (storeLogsRes) setStoreLogs(storeLogsRes);

            setIsLoading(false);
        } catch (error) {
            console.error("Failed to fetch config data:", error);
            setIsLoading(false);
        }
    };

    // 5. Welcoming Logic (Reusable)
    const showWelcome = useCallback(async (targetUser, forceAttendanceMsg = null) => {
        if (!targetUser) return;
        const pTeam = (targetUser.parentTeam || '').trim().toLowerCase();
        const isMKT = pTeam.includes('mkt support');
        const isAM = pTeam.includes('am');

        if (!isMKT && !isAM) return;

        try {
            const randomQuote = MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];

            // Count tasks
            const allTasks = await firestoreAPI.getTasks();

            // MKT Support Logic: Tasks assigned to them due today
            const todayTasks = allTasks.filter(task => {
                return task.assignee?.id === targetUser.id &&
                    task.status !== 'Hoàn thành' &&
                    !task.deletePending &&
                    isTaskDueToday(task.deadline);
            });

            // AM Logic: Tasks created by them (Stats)
            let amStats = null;
            if (isAM) {
                const targetEmail = (targetUser.email || '').toLowerCase();
                const storageKey = `last_welcome_seen_${targetEmail}`;
                const lastSeenTime = parseInt(localStorage.getItem(storageKey) || '0', 10);

                // Helper to get task timestamp safely
                const getTaskTime = (t) => {
                    const time = t.completedAt || t.updatedAt || t.createdAt; // Prioritize completion time
                    if (time?.toMillis) return time.toMillis();
                    if (time?.seconds) return time.seconds * 1000;
                    if (time instanceof Date) return time.getTime();
                    if (typeof time === 'string') return new Date(time).getTime();
                    return 0;
                };

                const targetName = (targetUser.name || '').trim().toLowerCase();
                const myTasks = allTasks.filter(t => {
                    const isCreator = targetEmail && (t.createdBy || '').toLowerCase() === targetEmail;
                    const isAssignedAM = targetName && (t.am || '').trim().toLowerCase() === targetName;
                    return (isCreator || isAssignedAM) && !t.deletePending;
                });

                // Helper to check if a date is today
                const isToday = (timestamp) => {
                    if (!timestamp) return false;
                    const d = new Date(timestamp);
                    const now = new Date();
                    return d.getDate() === now.getDate() &&
                        d.getMonth() === now.getMonth() &&
                        d.getFullYear() === now.getFullYear();
                };

                // 1. Completed: Count tasks completed TODAY
                const completed = myTasks.filter(t => {
                    const isCompleted = ['Hoàn thành', 'Done', 'Completed'].includes(t.status);
                    if (!isCompleted) return false;

                    // Use completedTimestamp if available, otherwise fallback
                    const time = t.completedTimestamp || getTaskTime(t);
                    return isToday(time);
                }).length;

                // 2. Backlog: Active tasks (Not completed)
                const backlog = myTasks.filter(t => !['Hoàn thành', 'Done', 'Completed'].includes(t.status));

                const newly = backlog.filter(t => ['Mới', 'New'].includes(t.status)).length;
                const processing = backlog.filter(t => ['Đang thực hiện', 'Chờ xử lý', 'In Progress', 'In Process', 'Processing', 'Pending'].includes(t.status)).length;

                // Other active tasks
                const other = backlog.length - (newly + processing);

                amStats = { completed, new: newly, processing, other, total: backlog.length + completed };

                // Update last seen time (still useful for other potential features)
                localStorage.setItem(storageKey, Date.now().toString());
            }

            if (isAM) {
                setWelcomeModal({
                    userName: targetUser.name,
                    isAMTeam: true,
                    quote: randomQuote,
                    amStats: amStats
                });
            } else {
                setWelcomeModal({
                    userName: targetUser.name,
                    attendanceMessage: forceAttendanceMsg || '',
                    taskCount: todayTasks.length,
                    quote: randomQuote,
                    isAMTeam: false
                });
            }
        } catch (err) {
            console.error("Failed to show welcome modal:", err);
        }
    }, [shiftDefinitions]);

    // Keep track of user for subscriptions
    const userRef = useRef(user);
    useEffect(() => {
        userRef.current = user;
    }, [user]);

    // Track if welcome modal has been shown in this tab session
    const hasShownWelcomeRef = useRef(false);

    useEffect(() => {
        // Show welcome modal on app load if user exists and not shown yet in this session
        const hasShownThisSession = sessionStorage.getItem('hasShownWelcomeSession') === 'true';

        if (!isLoading && user && !welcomeModal && !hasShownThisSession) {
            showWelcome(user);
            sessionStorage.setItem('hasShownWelcomeSession', 'true');
            hasShownWelcomeRef.current = true;
        }
    }, [isLoading, user, showWelcome]);

    useEffect(() => {
        if (!user) return;

        // Real-time subscriptions
        // Create subscriptions only when user is authenticated to avoid permission errors
        const unsubTasks = firestoreAPI.subscribeToTasks((data) => {
            const sortedTasks = [...data].sort((a, b) => {
                const idA = (a.id || '').toString().match(/\d+/) ? parseInt(a.id.toString().match(/\d+/)[0]) : 0;
                const idB = (b.id || '').toString().match(/\d+/) ? parseInt(b.id.toString().match(/\d+/)[0]) : 0;
                return idB - idA;
            });
            setTasks(sortedTasks);
        });

        const unsubPersonnel = firestoreAPI.subscribeToPersonnel((data) => {
            setPersonnel(data);
            // Sync current user using Ref to avoid stale closure
            const currentUser = userRef.current;
            if (currentUser && currentUser.email) {
                const freshUser = data.find(p => p.email.toLowerCase() === currentUser.email.toLowerCase());
                if (freshUser) {
                    setUser(prev => {
                        // Only update if we are still logged in (prev is not null)
                        if (!prev) return null;

                        const updated = { ...prev, ...freshUser };
                        // Don't save to localStorage if we are in the process of logging out (handled by logic check)
                        // But here we are assuming we are logged in.
                        localStorage.setItem('currentUser', JSON.stringify(updated));
                        return updated;
                    });
                }
            }
        });

        const unsubAttendance = firestoreAPI.subscribeToAllAttendance((data) => {
            setAttendance(data);
        });

        const unsubNotifs = firestoreAPI.subscribeToNotifications((data) => {
            setNotifications(data);
        });

        const unsubSettings = firestoreAPI.subscribeToSettings((data) => {
            if (data) {
                const { isDarkMode, ...serverData } = data;
                setSettings(prev => ({ ...prev, ...serverData }));
            }
        });
        const unsubHistory = firestoreAPI.subscribeToAttendanceHistory((data) => {
            setAttendanceHistory(data);
        });

        const unsubKnowledge = firestoreAPI.subscribeToKnowledge((data) => {
            setKnowledge(data);

            // Check for new/updated knowledge articles
            if (user && data.length > 0) {
                try {
                    const lastCheckKey = `lastKnowledgeCheck_${user.id}`;
                    const lastCheck = localStorage.getItem(lastCheckKey);

                    let timeThreshold = 0;
                    if (lastCheck) {
                        timeThreshold = parseInt(lastCheck);
                    } else {
                        // First time: Show items from last 3 days so it's not empty
                        timeThreshold = Date.now() - (3 * 24 * 60 * 60 * 1000);
                    }

                    // Find articles created or updated after threshold
                    const newArticles = data.filter(article => {
                        const articleTime = article.updatedAt || article.createdAt;
                        if (!articleTime) return false;

                        let articleTimestamp;
                        if (typeof articleTime === 'string') {
                            articleTimestamp = new Date(articleTime).getTime();
                        } else if (articleTime && typeof articleTime.toMillis === 'function') {
                            articleTimestamp = articleTime.toMillis();
                        } else if (articleTime && typeof articleTime.toDate === 'function') {
                            articleTimestamp = articleTime.toDate().getTime();
                        } else if (articleTime && articleTime.seconds) {
                            articleTimestamp = articleTime.seconds * 1000;
                        } else {
                            articleTimestamp = new Date(articleTime).getTime();
                        }

                        return articleTimestamp > timeThreshold;
                    });

                    // Show modal if there are new articles
                    if (newArticles.length > 0) {
                        setNewKnowledgeModal({
                            items: newArticles.sort((a, b) => {
                                const getTime = (t) => {
                                    if (!t) return 0;
                                    if (typeof t === 'string') return new Date(t).getTime();
                                    if (typeof t.toMillis === 'function') return t.toMillis();
                                    if (t.seconds) return t.seconds * 1000;
                                    return new Date(t).getTime();
                                };
                                return getTime(b.updatedAt || b.createdAt) - getTime(a.updatedAt || a.createdAt);
                            })
                        });
                    }

                    // Update last check time
                    localStorage.setItem(lastCheckKey, Date.now().toString());
                } catch (error) {
                    console.error('Error checking for new knowledge:', error);
                }
            }
        });

        const unsubKnowledgeCats = firestoreAPI.subscribeToKnowledgeCategories((data) => {
            setKnowledgeCategories(data);
        });

        // Re-assert online status for existing session
        // Use the initial user value for this check only
        if (user && user.id) {
            firestoreAPI.updatePersonnel(user.id, { isOnline: true, status: 'active' })
                .catch(e => console.error("Failed to re-assert online status", e));
        }

        const unsubStores = firestoreAPI.subscribeToStores((data) => {
            setStores(data);
        });

        const unsubStoreLogs = firestoreAPI.subscribeToStoreLogs((data) => {
            setStoreLogs(data);
        });

        return () => {
            unsubTasks();
            unsubPersonnel();
            unsubAttendance();
            unsubNotifs();
            unsubSettings();
            unsubHistory();
            unsubKnowledge();
            unsubKnowledgeCats();
            unsubStores();
            unsubStoreLogs();
        };
    }, [user?.id]); // Re-subscribe when user changes (e.g. login)

    // Re-fetch data when user logs in (to get authenticated-only data)
    useEffect(() => {
        if (user) {
            console.log("User logged in/detected, fetching all protected data...");
            setIsLoading(true);
            fetchAllData();
        }
    }, [user?.firebaseUid, user?.id]); // Depend on unstable IDs from auth to trigger on login

    // Apply primary color theme
    useEffect(() => {
        if (settings?.primaryColor) {
            document.documentElement.style.setProperty('--primary', settings.primaryColor);
            // Also update variants
            document.documentElement.style.setProperty('--primary-bg', `${settings.primaryColor}20`);
            document.documentElement.style.setProperty('--bg-accent', `${settings.primaryColor}15`);
        }
    }, [settings?.primaryColor]);

    // Apply Dark/Light theme
    useEffect(() => {
        const isDark = settings?.isDarkMode ?? true;
        document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    }, [settings?.isDarkMode]);

    // Auth Actions
    const updateUserStatus = useCallback(async (status) => {
        if (!user || user.status === status) return;

        // Optimistic local update
        setUser(prev => ({ ...prev, status }));

        // Update personnel list locally to reflect immediately in sidebar
        setPersonnel(prev => prev.map(p => p.id === user.id ? { ...p, status } : p));

        try {
            await firestoreAPI.updatePersonnel(user.id, { status });
        } catch (e) {
            console.error(`Failed to set status to ${status}`, e);
        }
    }, [user]);

    const login = useCallback(async (email, password) => {
        try {
            let firebaseUser = null;
            let isMigration = false;

            // 1. Try Firebase Auth Login first
            try {
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                firebaseUser = userCredential.user;
            } catch (authError) {
                // 2. If user not found or invalid credential, check legacy system
                if (authError.code === 'auth/user-not-found' || authError.code === 'auth/invalid-credential' || authError.code === 'auth/invalid-email') {
                    // Fetch fresh personnel list to check legacy password
                    console.log("Checking legacy for:", email);
                    const personnelList = await firestoreAPI.getPersonnel();
                    const found = personnelList.find(p => p.email && p.email.trim().toLowerCase() === email.trim().toLowerCase());

                    if (found) {
                        const legacyPass = (found.password || '').trim();
                        const inputPass = (password || '').trim();

                        if (legacyPass === inputPass) {
                            // 3. JIT Migration: Create Firebase Account with existing credentials
                            try {
                                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                                firebaseUser = userCredential.user;
                                isMigration = true;

                                // 4. SECURITY UPGRADE: Clear the plain text password from Firestore
                                firestoreAPI.updatePersonnel(found.id, {
                                    password: null, // Remove plain text password
                                    hasFirebaseAccount: true
                                }).catch(err => console.error("Failed to clear legacy password", err));

                            } catch (createError) {
                                // If create fails (e.g. email-already-in-use but login failed? Weird state), return error
                                console.error("Migration failed:", createError);
                                if (createError.code === 'auth/email-already-in-use') {
                                    return { success: false, message: 'Tài khoản đã tồn tại trên hệ thống bảo mật nhưng sai mật khẩu. Vui lòng liên hệ Admin để reset.' };
                                }
                                return { success: false, message: 'Lỗi tạo tài khoản bảo mật: ' + createError.message };
                            }
                        } else {
                            console.log("Legacy password mismatch");
                            return { success: false, message: 'Email hoặc mật khẩu không chính xác.' };
                        }
                    } else {
                        console.log("Email not found in legacy DB");
                        return { success: false, message: 'Email hoặc mật khẩu không chính xác.' };
                    }
                } else {
                    // Real network error or other auth error
                    console.error("Firebase Auth Error:", authError);
                    return { success: false, message: 'Lỗi xác thực: ' + authError.message };
                }
            }

            // --- SUCCCESSFUL AUTH (Either direct or migrated) ---
            if (firebaseUser) {
                // Fetch user data from Firestore to populate app state
                const personnelList = await firestoreAPI.getPersonnel();
                const found = personnelList.find(p => p.email && p.email.toLowerCase() === email.trim().toLowerCase());

                if (!found) {
                    return { success: false, message: 'Tài khoản đã xác thực nhưng không tìm thấy dữ liệu nhân sự.' };
                }

                const newUser = { ...found, isOnline: true, status: 'active', firebaseUid: firebaseUser.uid };

                // Update online status
                try {
                    await firestoreAPI.updatePersonnel(found.id, { isOnline: true, status: 'active' });
                    setPersonnel(prev => prev.map(p => p.id === found.id ? { ...p, isOnline: true, status: 'active' } : p));
                } catch (e) {
                    console.error("Failed to set online status", e);
                }

                setUser(newUser);
                localStorage.setItem('currentUser', JSON.stringify(newUser));
                localStorage.setItem('lastActivityTime', Date.now().toString());

                // Log Login History
                const now = new Date();
                const todayStr = now.toISOString().split('T')[0];

                // --- AUTO ATTENDANCE TRACKING (Night Shift 90-min Window) ---
                const pTeam = (newUser.parentTeam || '').trim().toLowerCase();
                const isMKT = pTeam.includes('mkt support');
                const isAM = pTeam.includes('am');
                let isFirstCheckInToday = false;

                // Attendance tracking: MKT SP always ON, AM controlled by settings toggle
                const shouldTrackAttendance = isMKT || (isAM && settings.enableAmAttendance);

                if (shouldTrackAttendance) {
                    try {
                        const STALE_THRESHOLD_MINUTES = 90; // Auto check-out after 90 min offline
                        const CHECK_IN_WINDOW_MINUTES = 90; // Check-in allowed 90 min before/after shift

                        const yesterday = new Date(now);
                        yesterday.setDate(yesterday.getDate() - 1);
                        const yesterdayStr = yesterday.toISOString().split('T')[0];

                        // Fetch fresh attendance data
                        const freshAttendance = await firestoreAPI.getAttendanceByUser(newUser.id);

                        const getRecordSortTime = (r) => {
                            if (r.checkInTime) return new Date(r.checkInTime).getTime();
                            if (r.timestamp) return new Date(r.timestamp).getTime();
                            return 0;
                        };

                        const sortedAttendance = [...freshAttendance].sort((a, b) => {
                            if (a.date !== b.date) return b.date.localeCompare(a.date);
                            return getRecordSortTime(b) - getRecordSortTime(a);
                        });

                        // ── STEP 1: Close stale sessions (auto check-out) ──
                        const staleSessions = sortedAttendance.filter(r => r.status === 'working' && r.userId === newUser.id);
                        for (const staleRecord of staleSessions) {
                            const lastActive = new Date(staleRecord.lastActive || staleRecord.checkInTime).getTime();
                            const gapMinutes = (now.getTime() - lastActive) / (1000 * 60);

                            if (gapMinutes > STALE_THRESHOLD_MINUTES) {
                                // Auto close: check-out at lastActive time
                                const checkOutTime = staleRecord.lastActive || staleRecord.checkInTime;
                                const checkIn = new Date(staleRecord.checkInTime).getTime();
                                const checkOut = new Date(checkOutTime).getTime();
                                const diffMs = checkOut - checkIn;
                                const h = Math.floor(diffMs / (1000 * 60 * 60));
                                const m = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                                const s = Math.floor((diffMs % (1000 * 60)) / 1000);
                                const duration = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

                                await firestoreAPI.updateAttendance(staleRecord.id, {
                                    status: 'completed',
                                    checkOutTime: checkOutTime,
                                    duration: duration,
                                    lastActive: checkOutTime
                                });
                                setAttendance(prev => prev.map(a => a.id === staleRecord.id
                                    ? { ...a, status: 'completed', checkOutTime, duration, lastActive: checkOutTime }
                                    : a
                                ));

                                const autoTimeStr = new Date(checkOutTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date(checkOutTime).toLocaleDateString('en-GB');
                                const autoCheckoutLog = {
                                    id: `HIST-${Date.now()}-auto`,
                                    userId: newUser.id,
                                    userName: newUser.name,
                                    action: 'AUTO_CHECKOUT',
                                    timestamp: new Date(checkOutTime).toISOString(),
                                    details: `Tự động check-out lúc ${autoTimeStr} (offline > ${STALE_THRESHOLD_MINUTES} phút)`
                                };
                                setAttendanceHistory(prev => [autoCheckoutLog, ...prev]);
                                firestoreAPI.addAttendanceHistory(autoCheckoutLog).catch(e => console.error("Failed to log auto checkout", e));
                                console.log(`Auto check-out stale session ${staleRecord.id} at ${autoTimeStr}`);
                            }
                        }

                        // ── STEP 2: Determine current shift ──
                        const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
                        const currentDayCode = days[now.getDay()];
                        let userShift = newUser.workShifts?.[currentDayCode];

                        // Night shift correction: if login before 9 AM, check yesterday's night shift
                        if (now.getHours() < 9 && newUser.workShifts) {
                            const yDayCode = days[yesterday.getDay()];
                            const yShift = newUser.workShifts[yDayCode];
                            if (yShift && (yShift.startsWith('S') || yShift.includes('Đêm'))) {
                                userShift = yShift;
                            }
                        }

                        // ── STEP 3: Check schedule validation ──
                        let shouldSkipAutoCheckIn = false;

                        // Re-fetch after stale cleanup
                        const refreshedAttendance = await firestoreAPI.getAttendanceByUser(newUser.id);
                        const reSorted = [...refreshedAttendance].sort((a, b) => {
                            if (a.date !== b.date) return b.date.localeCompare(a.date);
                            return getRecordSortTime(b) - getRecordSortTime(a);
                        });
                        const todayRecord = reSorted.find(r => r.date === todayStr);
                        const yesterdayRecord = reSorted.find(r => r.date === yesterdayStr);

                        // Explicit 'Work' registration override (from Schedule)
                        const isExplicitWork = todayRecord && todayRecord.status === 'Work';

                        if (todayRecord && !isExplicitWork) {
                            if (['OFF', 'NP', 'ME', 'NL', 'Nghỉ'].includes(todayRecord.status)) {
                                console.log("Auto-attendance skipped: User is explicitly OFF today.");
                                shouldSkipAutoCheckIn = true;
                            }
                        }

                        // Determine effective shift for validation
                        let effectiveShift = userShift;
                        if (isExplicitWork) {
                            // If manually registered as Work, treat as valid shift even if recurring schedule is Off
                            shouldSkipAutoCheckIn = false;

                            // Use record's shift if available, or fallback to default (e.g. Ca 1)
                            if (!effectiveShift || effectiveShift === '-' || effectiveShift === 'Nghỉ') {
                                effectiveShift = todayRecord.workShift || (shiftDefinitions && shiftDefinitions.length > 0 ? shiftDefinitions[0].name : 'Ca 1');
                            }
                        }

                        if (!shouldSkipAutoCheckIn && (!effectiveShift || effectiveShift === '-' || effectiveShift === 'Nghỉ')) {
                            console.log("Auto-attendance skipped: No scheduled shift.");
                            shouldSkipAutoCheckIn = true;
                        }

                        // ── STEP 4: Check-in window validation (90 min) ──
                        if (!shouldSkipAutoCheckIn) {
                            // Ensure shift definitions are available
                            let currentShiftDefs = shiftDefinitions;
                            if (!currentShiftDefs || currentShiftDefs.length === 0) {
                                try { currentShiftDefs = await firestoreAPI.getShiftDefinitions(); } catch (e) { }
                            }

                            const withinWindow = isWithinCheckInWindow(effectiveShift, now, currentShiftDefs, newUser, CHECK_IN_WINDOW_MINUTES);

                            // Check if already checked in for current shift
                            const hasActiveSession = todayRecord && (todayRecord.status === 'working' || todayRecord.status === 'completed');
                            // Also check yesterday for ongoing night shift
                            const hasYesterdayActiveSession = yesterdayRecord && yesterdayRecord.status === 'working';

                            if (hasActiveSession) {
                                // Already has attendance for today → log re-login
                                const timeString = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) + ' ' + now.toLocaleDateString('en-GB');
                                const reLoginLog = {
                                    id: `HIST-${Date.now()}`,
                                    userId: newUser.id,
                                    userName: newUser.name,
                                    action: 'RE_LOGIN',
                                    timestamp: now.toISOString(),
                                    details: `Đăng nhập lại hệ thống lúc ${timeString}`
                                };
                                setAttendanceHistory(prev => [reLoginLog, ...prev]);
                                firestoreAPI.addAttendanceHistory(reLoginLog).catch(e => console.error("Failed to log re-login", e));
                                console.log("Attendance: Re-login logged (session already exists for today)");

                            } else if (hasYesterdayActiveSession) {
                                // Yesterday's night shift still active
                                await firestoreAPI.updateAttendance(yesterdayRecord.id, { lastActive: now.toISOString() });
                                console.log("Attendance: Resumed yesterday's night shift session");

                            } else if (withinWindow) {
                                // ✅ Within check-in window → Create or Update CHECK_IN
                                const checkInTime = now.toISOString();
                                const commonData = {
                                    checkInTime,
                                    checkOutTime: null,
                                    duration: null,
                                    status: 'working',
                                    lastActive: checkInTime
                                };

                                if (isExplicitWork) {
                                    // Update existing 'Work' reservation
                                    const updatedRecord = { ...todayRecord, ...commonData, workShift: effectiveShift };
                                    setAttendance(prev => prev.map(r => r.id === todayRecord.id ? updatedRecord : r));
                                    await firestoreAPI.updateAttendance(todayRecord.id, commonData); // Only update fields
                                    console.log("Attendance: Activated existing 'Work' reservation");
                                } else {
                                    // Create new record
                                    const newRecord = {
                                        id: `ATT-${Date.now()}-${newUser.id}`,
                                        userId: newUser.id,
                                        userName: newUser.name,
                                        date: todayStr,
                                        ...commonData
                                    };
                                    setAttendance(prev => [...prev, newRecord]);
                                    await firestoreAPI.addAttendance(newRecord);
                                    console.log("Attendance: Created new CHECK_IN record");
                                }
                                isFirstCheckInToday = true;
                                isFirstCheckInToday = true;

                                const timeString = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) + ' ' + now.toLocaleDateString('en-GB');
                                const checkInLog = {
                                    id: `HIST-${Date.now()}-ci`,
                                    userId: newUser.id,
                                    userName: newUser.name,
                                    action: 'CHECK_IN',
                                    timestamp: now.toISOString(),
                                    details: `Vào ca làm lúc ${timeString}`
                                };
                                setAttendanceHistory(prev => [checkInLog, ...prev]);
                                firestoreAPI.addAttendanceHistory(checkInLog).catch(e => console.error("Failed to log check-in", e));
                                console.log("Attendance: CHECK_IN created (within 90-min window)");

                            } else {
                                // ❌ Outside check-in window → Only log system login
                                const timeString = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) + ' ' + now.toLocaleDateString('en-GB');
                                const loginOnlyLog = {
                                    id: `HIST-${Date.now()}`,
                                    userId: newUser.id,
                                    userName: newUser.name,
                                    action: 'LOGIN',
                                    timestamp: now.toISOString(),
                                    details: `Đăng nhập hệ thống lúc ${timeString} (ngoài khung giờ chấm công)`
                                };
                                setAttendanceHistory(prev => [loginOnlyLog, ...prev]);
                                firestoreAPI.addAttendanceHistory(loginOnlyLog).catch(e => console.error("Failed to log login", e));
                                console.log("Attendance: Login logged only (outside 90-min check-in window)");
                            }
                        }
                    } catch (err) {
                        console.error("Auto attendance error:", err);
                    }
                } else {
                    // Non-tracked teams: just log login
                    const hasLoggedInToday = attendanceHistory.some(h =>
                        h.userId === newUser.id &&
                        h.action === 'LOGIN' &&
                        h.timestamp?.startsWith?.(todayStr)
                    );
                    if (!hasLoggedInToday) {
                        const timeString = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) + ' ' + now.toLocaleDateString('en-GB');
                        const loginRecord = {
                            id: `HIST-${Date.now()}`,
                            userId: newUser.id,
                            userName: newUser.name,
                            action: 'LOGIN',
                            timestamp: now.toISOString(),
                            details: `Đăng nhập hệ thống lúc ${timeString}`
                        };
                        setAttendanceHistory(prev => [loginRecord, ...prev]);
                        firestoreAPI.addAttendanceHistory(loginRecord).catch(e => console.error("Failed to log login", e));
                    }
                }
                // -----------------------------

                // --- WELCOME NOTIFICATION FOR MKT SUPPORT & AM TEAM ---

                if (pTeam.includes('mkt support') || pTeam.includes('am')) {
                    try {
                        const now = new Date();
                        const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
                        const currentDayCode = days[now.getDay()];
                        let userShift = newUser.workShifts?.[currentDayCode];

                        // Night Shift Correction: If check-in is before 9 AM, use yesterday's shift if it was a night shift
                        if (now.getHours() < 9 && newUser.workShifts) {
                            const yesterday = new Date(now);
                            yesterday.setDate(yesterday.getDate() - 1);
                            const yDayCode = days[yesterday.getDay()];
                            const yShift = newUser.workShifts[yDayCode];
                            if (yShift && (yShift.startsWith('S') || yShift.includes('Đêm'))) {
                                userShift = yShift;
                            }
                        }

                        // Calculate lateness ONLY on first check-in (using shared flag)
                        let attendanceMessage = '';
                        if (isFirstCheckInToday && userShift && userShift !== 'Nghỉ' && userShift !== '-') {
                            const shiftTimes = getShiftStartTime(userShift, newUser, shiftDefinitions);
                            if (shiftTimes) {
                                const lateMinutes = calculateLateMinutes(now, shiftTimes);

                                if (lateMinutes > 0) {
                                    attendanceMessage = `Bạn đã đến muộn ${lateMinutes} phút. Hãy cố gắng đi làm sớm hơn vào ngày mai nhé! 💪`;
                                } else if (lateMinutes < 0) {
                                    const earlyMinutes = Math.abs(lateMinutes);
                                    attendanceMessage = `Tuyệt vời! Bạn đã đến sớm ${earlyMinutes} phút. Hãy tiếp tục phát huy! 🌟`;
                                } else {
                                    attendanceMessage = `Tuyệt vời! Bạn đã đến đúng giờ. Hãy tiếp tục phát huy! 🌟`;
                                }
                            }
                        }

                        // Count today's tasks
                        const allTasks = await firestoreAPI.getTasks();
                        const todayTasks = allTasks.filter(task => {
                            return task.assignee?.id === newUser.id &&
                                task.status !== 'Hoàn thành' &&
                                !task.deletePending &&
                                isTaskDueToday(task.deadline);
                        });

                        // Show welcome modal using common function
                        await showWelcome(newUser, attendanceMessage);
                    } catch (err) {
                        console.error("Welcome notification error:", err);
                    }
                }
                // -----------------------------

                // Mark as shown for manual login session too
                sessionStorage.setItem('hasShownWelcomeSession', 'true');
                hasShownWelcomeRef.current = true;

                return { success: true };
            }
            return { success: false, message: 'Đăng nhập thất bại.' };
        } catch (error) {
            console.error("Login error:", error);
            return { success: false, message: 'Đã xảy ra lỗi khi đăng nhập: ' + error.message };
        }
    }, [attendanceHistory, shiftDefinitions]);

    const checkEmailStatus = useCallback(async (email) => {
        try {
            const personnelList = await firestoreAPI.getPersonnel();
            const found = personnelList.find(p => p.email && p.email.toLowerCase() === email.trim().toLowerCase());
            if (found) {
                return {
                    exists: true,
                    // If they have a legacy password OR have been migrated to Firebase, we consider them as "having a password"
                    // preventing the "First Time Setup" screen from appearing unnecessarily.
                    hasPassword: !!found.password || !!found.hasFirebaseAccount,
                    name: found.name,
                    avatar: found.avatar
                };
            }
            return { exists: false };
        } catch (error) {
            console.error("Check email status error:", error);
            return { exists: false, error: true };
        }
    }, []);

    const setPassword = useCallback(async (email, password) => {
        try {
            const personnelList = await firestoreAPI.getPersonnel();
            const found = personnelList.find(p => p.email && p.email.toLowerCase() === email.trim().toLowerCase());
            if (found) {
                await firestoreAPI.updatePersonnel(found.id, { password });
                setPersonnel(prev => prev.map(p => p.id === found.id ? { ...p, password } : p));
                return true;
            }
            return false;
        } catch (error) {
            console.error("Set password error:", error);
            return false;
        }
    }, []);

    const logout = useCallback(async () => {
        if (user && user.id) {
            try {
                // Wait for the update to complete
                await firestoreAPI.updatePersonnel(user.id, { isOnline: false, status: 'offline' });

                // Optimistic local update
                setPersonnel(prev => prev.map(p => p.id === user.id ? { ...p, isOnline: false, status: 'offline' } : p));

                // Sign out from Firebase Auth as well
                await signOut(auth).catch(e => console.error("Firebase SignOut error:", e));
            } catch (e) {
                console.error("Failed to set offline status", e);
            }
        }
        setUser(null);
        localStorage.removeItem('currentUser');
        localStorage.removeItem('lastActivityTime');
        sessionStorage.removeItem('hasShownWelcomeSession');
        hasShownWelcomeRef.current = false; // Reset for next login

        // Force redirect to ensure clean state and no lingering subscriptions
        window.location.href = '/login';
    }, [user]);

    // Idle Timer Logic
    useEffect(() => {
        if (!user) return;

        const IDLE_TIMEOUT = 30 * 60 * 1000; // 30 minutes
        const LOGOUT_TIMEOUT = 120 * 60 * 1000; // 120 minutes

        // Initial check on mount (in case they closed tab and reopened after 2 hours)
        const last = parseInt(localStorage.getItem('lastActivityTime') || Date.now());
        const initialInactiveDuration = Date.now() - last;
        if (initialInactiveDuration >= LOGOUT_TIMEOUT) {
            logout();
            return;
        }

        const handleActivity = () => {
            const now = Date.now();
            const last = parseInt(localStorage.getItem('lastActivityTime') || now);

            // Limit writes to localStorage to once every 5 seconds to avoid performance hit
            if (now - last > 5000) {
                localStorage.setItem('lastActivityTime', now.toString());
            }

            // If user was idle, set back to active
            if (user.status === 'idle') {
                updateUserStatus('active');
            }
        };

        // Attach listeners
        window.addEventListener('mousemove', handleActivity);
        window.addEventListener('keydown', handleActivity);
        window.addEventListener('click', handleActivity);
        window.addEventListener('scroll', handleActivity);

        // Check interval
        const checkInterval = setInterval(() => {
            const lastActivity = parseInt(localStorage.getItem('lastActivityTime') || Date.now());
            const now = Date.now();
            const inactiveDuration = now - lastActivity;

            if (inactiveDuration >= LOGOUT_TIMEOUT) {
                logout(); // Auto-logout
            } else if (inactiveDuration >= IDLE_TIMEOUT) {
                if (user.status !== 'idle') {
                    updateUserStatus('idle'); // Set to idle
                }
            }
        }, 60000); // Check every minute

        // Handle window close/refresh
        const handleBeforeUnload = () => {
            // Best effort to set offline. Note: Firestore write might not complete in time on close.
            // For guaranteed presence, Realtime Database is recommended, but this helps in many cases.
            if (user && user.id) {
                firestoreAPI.updatePersonnel(user.id, { isOnline: false, status: 'offline' });
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('mousemove', handleActivity);
            window.removeEventListener('keydown', handleActivity);
            window.removeEventListener('click', handleActivity);
            window.removeEventListener('scroll', handleActivity);
            window.removeEventListener('beforeunload', handleBeforeUnload);
            clearInterval(checkInterval);
        };
    }, [user, user?.status, logout]);

    // Heartbeat to update lastSeen every 4 minutes (to stay within 5 min threshold)
    useEffect(() => {
        if (!user || !user.id) return;

        const sendHeartbeat = async () => {
            try {
                // Only update if online
                if (user.status !== 'offline') {
                    await firestoreAPI.updatePersonnel(user.id, {
                        lastSeen: Date.now(),
                        isOnline: true
                    });

                    // Also update lastActive in current attendance record (for auto check-out accuracy)
                    try {
                        const freshAtt = await firestoreAPI.getAttendanceByUser(user.id);
                        const workingRecord = freshAtt.find(r => r.status === 'working' && r.userId === user.id);
                        if (workingRecord) {
                            await firestoreAPI.updateAttendance(workingRecord.id, { lastActive: new Date().toISOString() });
                        }
                    } catch (attErr) {
                        // Non-critical: don't break heartbeat if attendance update fails
                        console.warn("Heartbeat: Failed to update attendance lastActive", attErr);
                    }
                }
            } catch (e) {
                console.error("Heartbeat error:", e);
            }
        };

        const interval = setInterval(sendHeartbeat, 2 * 60 * 1000); // 2 minutes

        // Send one immediately on mount/login valid
        sendHeartbeat();

        return () => clearInterval(interval);
    }, [user?.id, user?.status]);

    // Actions
    const showToast = useCallback((message, title = 'Thông báo', options = {}) => {
        setToast({ message, title, ...options });
    }, []);

    const updateSettings = useCallback(async (newSettings) => {
        console.log("Debug: updateSettings called with", newSettings);
        // Optimistic update
        const updated = { ...settings, ...newSettings };
        setSettings(updated);

        // Handle Local Theme separately
        if (newSettings.isDarkMode !== undefined) {
            localStorage.setItem('theme', newSettings.isDarkMode ? 'dark' : 'light');
        }

        // Filter out isDarkMode from the update payload
        const { isDarkMode, ...patch } = newSettings;

        // If no other settings to update, return early
        if (Object.keys(patch).length === 0) {
            return;
        }

        try {
            if (updated.id) {
                await firestoreAPI.updateSettings(updated.id, patch);
            } else {
                console.warn("Skipping settings update: No ID");
            }
        } catch (err) {
            console.error(err);
        }
    }, [settings]);

    const addTask = useCallback(async (task) => {
        const newTask = {
            ...task,
            createdBy: user?.email || settings?.userEmail || 'system'
        };
        setTasks(prev => [newTask, ...prev]);
        try {
            await firestoreAPI.addTask(newTask);
            const isDesignRecord = newTask.source === 'design';
            const newNotif = {
                id: Date.now().toString(), // String ID
                type: isDesignRecord ? 'task-complete' : 'new-task',
                title: isDesignRecord ? `${newTask.assignee?.name || 'Thành viên'} hoàn thành Design` : `Task mới: ${newTask.name || newTask.title}`,
                message: isDesignRecord
                    ? `**${newTask.assignee?.name || 'Thành viên'}** vừa hoàn thành task design cho tiệm **${newTask.name}**`
                    : `Cho nhân sự: **${newTask.assignee?.name || 'Chưa gán'}** - AM: **${newTask.am || user?.name || 'Hệ thống'}**`,
                location: isDesignRecord ? 'Quản lý Design' : 'Hệ thống',
                time: 'Vừa xong',
                actionLabel: 'Xem',
                isRead: false,
                inShift: true,
                category: 'recent',
                taskId: newTask.id,
                targetUserEmail: newTask.assignee?.email,
                actorEmail: user?.email || settings?.userEmail,
                createdAt: { seconds: Math.floor(Date.now() / 1000) }
            };
            setNotifications(prev => [newNotif, ...prev]);
            await firestoreAPI.addNotification(newNotif);
        } catch (err) {
            console.error("Error adding task:", err);
        }
    }, [user, settings]);

    const deleteTask = useCallback(async (id, reason = '') => {
        const now = new Date();
        const dateStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
        const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) + ' ' + now.toLocaleDateString('en-GB');

        const taskToDelete = tasks.find(t => t.id === id);
        const updates = {
            deletePending: true,
            deletedAt: dateStr,
            deletedBy: user?.name || settings?.userName || 'system',
            deleteReason: reason
        };

        setTasks(prev => prev.map(task => task.id === id ? { ...task, ...updates } : task));

        // Log deletion to attendance history
        if (taskToDelete) {
            const deleteRecord = {
                id: `HIST-${Date.now()}`,
                userId: user?.id || 'system',
                userName: user?.name || settings?.userName || 'System',
                action: 'TASK_DELETE',
                timestamp: now.toISOString(),
                details: (taskToDelete.source === 'design'
                    ? `Xóa task design "${taskToDelete.name}" lúc ${timeStr}`
                    : `Xóa task "${taskToDelete.name || taskToDelete.title}" lúc ${timeStr}`) + (reason ? `. Lí do: ${reason}` : '')
            };
            setAttendanceHistory(prev => [deleteRecord, ...prev]);
            firestoreAPI.addAttendanceHistory(deleteRecord).catch(e => console.error("Failed to log task deletion", e));
        }

        try {
            await firestoreAPI.updateTask(id, updates);
        } catch (err) {
            console.error("Error marking task for deletion:", err);
        }
    }, [tasks, user, settings]);

    const permanentlyDeleteTask = useCallback(async (id) => {
        setTasks(prev => prev.filter(task => task.id !== id));
        try {
            await firestoreAPI.deleteTask(id);
        } catch (err) {
            console.error("Error permanently deleting task:", err);
        }
    }, []);

    const restoreTask = useCallback(async (id) => {
        const updates = {
            deletePending: false,
            deletedAt: null,
            deletedBy: null
        };
        setTasks(prev => prev.map(task => task.id === id ? { ...task, ...updates } : task));
        try {
            await firestoreAPI.updateTask(id, updates);
        } catch (err) {
            console.error("Error restoring task:", err);
        }
    }, []);

    const updateTask = useCallback(async (id, updates) => {
        const previousTasks = [...tasks];
        const oldTask = tasks.find(t => t.id === id);

        // Notify on Assignee Change
        if (oldTask && updates.assignee && JSON.stringify(oldTask.assignee) !== JSON.stringify(updates.assignee)) {
            const oldAssignee = oldTask.assignee?.name || 'Chưa gán';
            const newAssignee = updates.assignee.name || updates.assignee.email || 'Chưa gán';
            const actor = user?.name || settings?.userName || 'User';

            const newNotif = {
                id: Date.now().toString(),
                type: 'task-update',
                title: `Thay đổi nhân sự: ${oldTask.name || oldTask.title}`,
                message: `Từ **${oldAssignee}** sang **${newAssignee}** bởi **${actor}**`,
                location: 'Danh sách công việc',
                time: 'Vừa xong',
                actionLabel: 'Xem',
                isRead: false,
                inShift: true,
                category: 'recent',
                taskId: id,
                targetUserEmail: updates.assignee?.email,
                actorEmail: user?.email || settings?.userEmail,
                createdAt: { seconds: Math.floor(Date.now() / 1000) }
            };
            setNotifications(prev => [newNotif, ...prev]);
            firestoreAPI.addNotification(newNotif).catch(e => console.error("Notif error", e));
        }

        // Notify on Task Completion
        if (oldTask && updates.status === 'Hoàn thành' && oldTask.status !== 'Hoàn thành') {
            const now = new Date();
            const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok' });
            const dateStr = now.toLocaleDateString('en-GB', { timeZone: 'Asia/Bangkok' });

            updates.completedAt = `${timeStr} ${dateStr}`;
            updates.completedTimestamp = now.getTime();

            const actor = user?.name || settings?.userName || 'User';

            const isDesignRecord = oldTask.source === 'design';
            const newNotif = {
                id: Date.now().toString() + '-comp',
                type: 'task-complete',
                title: isDesignRecord ? `${actor} hoàn thành Design` : `Task hoàn thành`,
                message: isDesignRecord
                    ? `**${actor}** vừa hoàn thành task design cho tiệm **${oldTask.name}**`
                    : `**${actor}** vừa hoàn thành task **${oldTask.name || oldTask.title}**`,
                location: 'Danh sách công việc',
                time: 'Vừa xong',
                actionLabel: 'Xem',
                isRead: false,
                inShift: true,
                category: 'recent',
                taskId: id,
                targetUserEmail: oldTask.createdBy,
                actorEmail: user?.email || settings?.userEmail,
                createdAt: { seconds: Math.floor(Date.now() / 1000) }
            };
            setNotifications(prev => [newNotif, ...prev]);
            firestoreAPI.addNotification(newNotif).catch(e => console.error("Notif error", e));

            // Telegram Notification
            // Re-fetch settings to ensure we have the latest template
            const settingsRes = await firestoreAPI.getSettings();
            const latestSettings = settingsRes && settingsRes.length > 0 ? settingsRes[0] : {};
            // Use merged settings to fallback to context settings if fetch fails or returns partial
            const currentSettings = { ...settings, ...latestSettings };

            if (currentSettings?.telegramBotToken && currentSettings?.telegramChatId) {
                // FETCH FRESH Personnel list to ensure latest Telegram IDs are used
                let freshPersonnel = [];
                try {
                    freshPersonnel = await firestoreAPI.getPersonnel();
                } catch (pErr) {
                    console.warn("Could not fetch fresh personnel for notification, using cached:", pErr);
                    freshPersonnel = personnel;
                }

                const now = new Date();
                const timeStr = now.toLocaleString('en-US');

                // Get Priority Icon
                const priorityData = taskPriorities.find(p => p.name === oldTask.priority);
                const priorityIcon = priorityData?.icon || '⚠️';

                const cleanTelegramHandle = (input) => {
                    if (!input) return '';
                    let clean = input.trim();
                    clean = clean.replace(/^https:\/\/t\.me\//i, '');
                    clean = clean.replace(/^@/, '');
                    return clean ? `@${clean}` : '';
                };

                const getTeleUser = (identifier, userId = null) => {
                    if (!identifier) return escapeMarkdown('Không có');

                    const personnelList = freshPersonnel && freshPersonnel.length > 0 ? freshPersonnel : (currentSettings.personnel || []);

                    let user = null;
                    if (userId) user = personnelList.find(p => p.id === userId);

                    if (!user) {
                        user = personnelList.find(p =>
                            p.name?.trim().toLowerCase() === identifier.trim().toLowerCase() ||
                            p.email?.trim().toLowerCase() === identifier.trim().toLowerCase()
                        );
                    }

                    if (user && user.telegram) {
                        const handle = cleanTelegramHandle(user.telegram);
                        if (handle) {
                            return `${escapeMarkdown(user.name || identifier)} (${escapeMarkdown(handle)})`;
                        }
                    }
                    return escapeMarkdown(identifier);
                };

                // Helper to get raw telegram ID only (without name)
                const getRawTelegramId = (identifier, userId = null) => {
                    if (!identifier) return '';
                    const personnelList = freshPersonnel && freshPersonnel.length > 0 ? freshPersonnel : (currentSettings.personnel || []);

                    let user = null;
                    if (userId) user = personnelList.find(p => p.id === userId);

                    if (!user) {
                        user = personnelList.find(p =>
                            p.name?.trim().toLowerCase() === identifier.trim().toLowerCase() ||
                            p.email?.trim().toLowerCase() === identifier.trim().toLowerCase()
                        );
                    }

                    if (user && user.telegram) {
                        return escapeMarkdown(cleanTelegramHandle(user.telegram));
                    }
                    return '';
                };

                const defaultTemplate = `✅ *TASK HOÀN THÀNH*\n\n` +
                    `🏘 *Tên Tiệm:* {storeName}\n` +
                    `📝 *Nội dung:*\n{title}\n\n` +
                    `🛑 *Mức độ:* {priority} {priorityIcon}\n` +
                    `👷🏻‍♂️ *Support:* {support}\n` +
                    `🧑💼 *AM:* {am}\n` +
                    `🏷️ *Loại:* {type}\n` +
                    `📆 *Ngày nhận:* {date}\n` +
                    `🟢 *Trạng thái:* Hoàn thành\n` +
                    `🗒️ *Notes:* {notes}\n\n` +
                    `⏰ *Thời gian hoàn thành:* {completionTime}\n` +
                    `🥇 *Bởi:* {actor}`;

                const escapeMarkdown = (text) => {
                    if (!text) return '';
                    // Only escape characters that are strictly special in Markdown mode
                    // Specifically * and _ which break bold/italic if unescaped in dynamic content
                    return String(text).replace(/[_*[\]`]/g, '\\$&');
                };

                const formatComments = (comments) => {
                    if (!comments || comments.length === 0) return escapeMarkdown(oldTask.note || 'Không có');
                    return comments.map(c => {
                        const userName = c.author || c.user?.name || c.user || 'Người dùng';
                        const timeStr = c.time || (c.timestamp ? new Date(c.timestamp).toLocaleString('en-GB', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) : '');

                        const escapedText = escapeMarkdown(c.text);
                        const escapedUser = escapeMarkdown(userName);
                        const escapedTime = escapeMarkdown(timeStr);

                        return `- ${escapedText} (${escapedUser}${escapedTime ? ` - ${escapedTime}` : ''})`;
                    }).join('\n');
                };

                const template = currentSettings.telegramTemplate || defaultTemplate;

                console.log("Preparing Telegram Notification...");
                console.log("Lookup inputs -> AssigneeName:", oldTask.assignee?.name, "ID:", oldTask.assignee?.id);
                console.log("Lookup inputs -> SupportString:", oldTask.support);
                console.log("Lookup inputs -> CreatedBy(AM):", oldTask.createdBy, "AmString:", oldTask.am);

                // Replacements

                const message = template
                    .replace(/{storeName}/g, escapeMarkdown(oldTask.name || oldTask.storeName || 'Không có'))
                    .replace(/{title}/g, escapeMarkdown(oldTask.content || oldTask.title || ''))
                    .replace(/{task}/g, escapeMarkdown(oldTask.title || oldTask.name || 'Task'))
                    .replace(/{content}/g, escapeMarkdown(oldTask.content || ''))
                    .replace(/{priority}/g, escapeMarkdown(oldTask.priority || 'Trung bình'))
                    .replace(/{priorityIcon}/g, priorityIcon)
                    .replace(/{support}/g, getTeleUser(oldTask.assignee?.name || oldTask.support, oldTask.assignee?.id))
                    .replace(/{am}/g, getTeleUser(oldTask.am || oldTask.createdBy))
                    .replace(/{type}/g, escapeMarkdown(oldTask.type || 'Chưa phân loại'))
                    .replace(/{date}/g, escapeMarkdown(oldTask.date || oldTask.deadline || 'Không có'))
                    .replace(/{notes}/g, updates.completionNote ? escapeMarkdown(updates.completionNote) : formatComments(updates.comments || oldTask.comments))
                    .replace(/{completionTime}/g, escapeMarkdown(timeStr))
                    .replace(/{actor}/g, getTeleUser(user?.name || currentSettings?.userName || 'User', user?.id))
                    .replace(/{supportTelegramId}/g, getRawTelegramId(oldTask.assignee?.name || oldTask.support, oldTask.assignee?.id))
                    .replace(/{amTelegramId}/g, getRawTelegramId(oldTask.am || oldTask.createdBy));

                console.log("Sending Telegram Message:", message);

                fetch(`https://api.telegram.org/bot${currentSettings.telegramBotToken}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: currentSettings.telegramChatId,
                        text: message,
                        parse_mode: 'Markdown',
                        disable_web_page_preview: true
                    })
                }).catch(err => console.error("Telegram error:", err));
            }
        }

        // Optimistic update
        setTasks(prev => prev.map(task => task.id === id ? { ...task, ...updates } : task));
        try {

            const response = await firestoreAPI.updateTask(id, updates);

            // Update with actual server response to ensure consistency
            if (response) {
                setTasks(prev => prev.map(task => task.id === id ? response : task));
            }
        } catch (err) {
            console.error(`ERROR updating task ${id} in backend:`, err);
            // Revert to previous state on error
            setTasks(previousTasks);
            alert(`Có lỗi khi cập nhật task: ${err.message}`);
        }
    }, [tasks, user, settings, taskPriorities, personnel]);

    const deletePersonnel = useCallback(async (id) => {
        const person = personnel.find(p => p.id === id);
        if (person && person.role === 'Manager') {
            alert('Quyền Manager là quyền cao nhất và không thể bị xóa.');
            return;
        }

        setPersonnel(prev => prev.filter(p => p.id !== id));
        try {
            await firestoreAPI.deletePersonnel(id);
        } catch (err) {
            console.error(err);
        }
    }, [personnel]);

    const addPersonnel = useCallback(async (p) => {
        // Optimistic update
        setPersonnel(prev => [...prev, p]);
        try {
            const saved = await firestoreAPI.addPersonnel(p);
            // Update the optimistic entry with the actual saved data (including correct ID)
            setPersonnel(prev => prev.map(item => item.id === p.id ? saved : item));
        } catch (err) {
            console.error("Error adding personnel to database:", err);
            // Revert state on error
            setPersonnel(prev => prev.filter(person => person.id !== p.id));
            throw err; // Re-throw to allow component-level handling
        }
    }, []);

    const updatePersonnel = useCallback(async (id, updates) => {
        const oldPersonnel = [...personnel];
        const personToUpdate = personnel.find(p => p.id === id);

        if (!personToUpdate) return;

        // 1. Update Personnel list locally
        setPersonnel(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));

        // 2. Sync user state and localStorage if updating the current logged-in user
        if (user && personToUpdate.id === user.id) {
            setUser(prev => {
                const updated = { ...prev, ...updates };
                localStorage.setItem('currentUser', JSON.stringify(updated));
                return updated;
            });
        }

        // 3. Sync with tasks locally
        setTasks(prev => prev.map(task => {
            if (task.assignee && (task.assignee.id === id || task.assignee.email === personToUpdate.email)) {
                return { ...task, assignee: { ...task.assignee, ...updates } };
            }
            return task;
        }));

        try {
            await firestoreAPI.updatePersonnel(id, updates);
        } catch (err) {
            console.error("Error updating personnel:", err);
            // Revert on error
            setPersonnel(oldPersonnel);
            throw err;
        }
    }, [personnel, user]);

    // Permission Helper
    const canDo = useCallback((permission) => {
        // 1. Check user-specific permissions first (Direct Assignment)
        if (user?.permissions && Array.isArray(user.permissions) && user.permissions.includes(permission)) {
            return true;
        }

        // 2. Check Role-based permissions
        const roleName = user?.role || settings?.userRole;
        if (!roles || roles.length === 0) return false;

        // Find role data (case-insensitive check)
        const userRoleData = roles.find(r =>
            (r.name || '').trim().toLowerCase() === (roleName || '').trim().toLowerCase()
        );

        if (!userRoleData) return false;

        const perms = Array.isArray(userRoleData.permissions) ? userRoleData.permissions : [];
        return perms.includes('*') || perms.includes(permission);
    }, [user, settings, roles]);

    const markNotificationAsRead = useCallback(async (id) => {
        if (id === 'all') {
            const updatedNotifs = notifications.map(n => ({ ...n, isRead: true }));
            setNotifications(updatedNotifs);
            notifications.forEach(async (n) => {
                if (!n.isRead) {
                    await firestoreAPI.updateNotification(n.id, { isRead: true });
                }
            });
        } else {
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
            await firestoreAPI.updateNotification(id, { isRead: true });
        }
    }, [notifications]);

    const updateAttendance = useCallback(async (record) => {
        if (!record.userId || !record.date) return;

        // Find existing record for this user and date
        // Try precise match first
        const existing = (attendance || []).find(a =>
            a.date === record.date &&
            a.userId === record.userId
        );

        if (existing) {
            const updatedRecord = { ...existing, ...record };
            setAttendance(prev => prev.map(a => a.id === existing.id ? updatedRecord : a));
            await firestoreAPI.updateAttendance(existing.id, updatedRecord);
        } else {
            // Check if it's a default/virtual record from Schedule page (has id starting with 'default-' or 'off-')
            if (record.id && (record.id.startsWith('default-') || record.id.startsWith('off-'))) {
                // Remove the virtual ID to allow backend to create a real one
                const { id, isDefault, ...cleanRecord } = record;
                const newRecord = {
                    ...cleanRecord,
                    id: `ATT-${Date.now()}-${record.userId}`,
                    createdAt: new Date().toISOString()
                };
                setAttendance(prev => [...prev, newRecord]);
                await firestoreAPI.addAttendance(newRecord);
            } else {
                const newRecord = {
                    ...record,
                    id: record.id || `ATT-${Date.now()}-${record.userId}`,
                    createdAt: new Date().toISOString()
                };
                setAttendance(prev => [...prev, newRecord]);
                await firestoreAPI.addAttendance(newRecord);
            }
        }
    }, [attendance]);

    const clearAttendance = useCallback(async () => {
        setAttendance([]);
        setAttendanceHistory([]);
        try {
            await firestoreAPI.deleteAllAttendance();
            await firestoreAPI.deleteAllAttendanceHistory();
            console.log("All attendance records cleared.");
        } catch (err) {
            console.error("Failed to clear attendance:", err);
            throw err;
        }
    }, []);

    const addAttendanceHistory = useCallback(async (record) => {
        const newRecord = { ...record, id: Date.now().toString(), timestamp: new Date().toISOString() };
        setAttendanceHistory(prev => [newRecord, ...prev]);
        try {
            await firestoreAPI.addAttendanceHistory(newRecord);
        } catch (err) {
            console.error("Error adding history:", err);
        }
    }, []);

    // 10. Knowledge Base Actions
    const addKnowledge = useCallback(async (item) => {
        try {
            await firestoreAPI.addKnowledge(item);
        } catch (err) {
            console.error("Error adding knowledge:", err);
        }
    }, []);

    const updateKnowledge = useCallback(async (id, updates) => {
        try {
            await firestoreAPI.updateKnowledge(id, updates);
        } catch (err) {
            console.error("Error updating knowledge:", err);
        }
    }, []);

    const deleteKnowledge = useCallback(async (id) => {
        try {
            await firestoreAPI.deleteKnowledge(id);
        } catch (err) {
            console.error("Error deleting knowledge:", err);
        }
    }, []);

    // 11. Stores Actions
    const addStore = useCallback(async (store) => {
        try {
            await firestoreAPI.addStore(store);
            showToast('Đã thêm tiệm mới', 'Thành công', { type: 'success' });

            // Log quietly
            try {
                await firestoreAPI.addStoreLog({
                    action: 'create',
                    storeName: store.name,
                    userId: user?.id || 'system',
                    userName: user?.name || 'System',
                    details: `Thêm mới tiệm: ${store.name}`
                });
            } catch (logErr) {
                console.warn("Failed to log store creation:", logErr);
            }
        } catch (err) {
            console.error("Error adding store:", err);
            showToast('Lỗi khi thêm tiệm', 'Lỗi', { type: 'error' });
        }
    }, [user]);

    const updateStore = useCallback(async (id, updates) => {
        try {
            await firestoreAPI.updateStore(id, updates);
            showToast('Đã cập nhật thông tin tiệm', 'Thành công', { type: 'success' });

            // Log quietly
            try {
                const targetStore = stores.find(s => s.id === id);
                const storeName = (updates.name || targetStore?.name || 'Unknown Store');

                // Detailed change tracking (Old vs New)
                const changes = [];
                const sectionMap = { facebook: 'Facebook', instagram: 'Instagram', maps: 'Google Maps', yelp: 'Yelp', other: 'Khác' };
                const fieldMap = { link: 'Link', accounts: 'Tài khoản', username: 'User', password: 'Pass', twoFactor: '2FA', mail: 'Email', note: 'Ghi chú' };

                if (updates.name && updates.name !== targetStore?.name) {
                    changes.push(`Đổi tên: **${targetStore?.name || '(trống)'}** → **${updates.name}**`);
                }

                if (updates.notes !== undefined && updates.notes !== targetStore?.notes) {
                    changes.push(`Ghi chú chung: **${targetStore?.notes || '(trống)'}** → **${updates.notes || '(trống)'}**`);
                }

                ['facebook', 'instagram', 'maps', 'yelp', 'other'].forEach(sec => {
                    if (updates[sec]) {
                        const oldSec = targetStore?.[sec] || {};
                        const newSec = updates[sec];
                        const sectionChanges = [];

                        Object.keys(newSec).forEach(key => {
                            const oldVal = key === 'accounts'
                                ? (oldSec.accounts || (oldSec.account ? [oldSec.account] : []))
                                : (oldSec[key] === null || oldSec[key] === undefined ? '' : oldSec[key]);

                            const newVal = newSec[key];

                            let isChanged = false;
                            if (key === 'accounts') {
                                if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) isChanged = true;
                            } else if (newVal !== undefined && newVal.toString() !== oldVal.toString()) {
                                isChanged = true;
                            }

                            if (isChanged) {
                                const fieldLabel = fieldMap[key] || key;
                                const fmtOld = key === 'accounts' ? (oldVal.length ? oldVal.join(', ') : '(trống)') : (oldVal || '(trống)');
                                const fmtNew = key === 'accounts' ? (newVal.length ? newVal.join(', ') : '(trống)') : (newVal || '(trống)');
                                sectionChanges.push(`${fieldLabel}: **${fmtOld}** → **${fmtNew}**`);
                            }
                        });

                        if (sectionChanges.length > 0) {
                            changes.push(`${sectionMap[sec]}: ${sectionChanges.join('; ')}`);
                        }
                    }
                });

                const detailText = changes.length > 0
                    ? `Cập nhật tiệm **${storeName}**:\n${changes.join('\n')}`
                    : `Cập nhật thông tin tiệm **${storeName}**`;

                console.log(`Logging store update for: ${storeName}`);

                // 1. Log to dedicated storeLogs
                await firestoreAPI.addStoreLog({
                    action: 'update',
                    storeName: storeName,
                    userId: user?.id || 'system',
                    userName: user?.name || 'System',
                    details: detailText
                });

                await firestoreAPI.addAttendanceHistory({
                    id: `HIST-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                    userId: user?.id || 'system',
                    userName: user?.name || 'System',
                    action: 'STORE_UPDATE',
                    timestamp: firestoreAPI.serverTimestamp(),
                    details: detailText
                });
            } catch (logErr) {
                console.warn("Failed to log store update:", logErr);
            }
        } catch (err) {
            console.error("Error updating store:", err);
            showToast('Lỗi khi cập nhật tiệm', 'Lỗi', { type: 'error' });
        }
    }, [user, stores]);

    const deleteStore = useCallback(async (id) => {
        try {
            await firestoreAPI.deleteStore(id);
            showToast('Đã xóa tiệm vĩnh viễn', 'Thành công', { type: 'success' });

            // Log quietly
            try {
                const targetStore = stores.find(s => s.id === id);
                const storeName = targetStore?.name || 'Unknown Store';

                await firestoreAPI.addStoreLog({
                    action: 'permanent_delete',
                    storeName: storeName,
                    userId: user?.id || 'system',
                    userName: user?.name || 'System',
                    details: `Xóa vĩnh viễn: ${storeName}`
                });
            } catch (logErr) {
                console.warn("Failed to log store deletion:", logErr);
            }
        } catch (err) {
            console.error("Error deleting store:", err);
            showToast('Lỗi khi xóa tiệm', 'Lỗi', { type: 'error' });
        }
    }, [user, stores]);

    const softDeleteStore = useCallback(async (store) => {
        try {
            const now = new Date();
            await firestoreAPI.updateStore(store.id, {
                deletePending: true,
                deletedBy: user?.name || 'Unknown',
                deletedAt: now.toISOString()
            });
            showToast('Đã chuyển vào thùng rác chờ duyệt', 'Thành công', { type: 'success' });

            // Log quietly
            try {
                // Log to Attendance History (Legacy/Global)
                const deleteRecord = {
                    id: `HIST-${Date.now()}`,
                    userId: user?.id || 'system',
                    userName: user?.name || 'System',
                    action: 'STORE_DELETE_REQ',
                    timestamp: now.toISOString(),
                    details: `Yêu cầu xóa tiệm "${store.name}"`
                };
                await firestoreAPI.addAttendanceHistory(deleteRecord);

                // Log to Store History (Specific)
                await firestoreAPI.addStoreLog({
                    action: 'delete_request',
                    storeName: store.name,
                    userId: user?.id || 'system',
                    userName: user?.name || 'System',
                    details: `Yêu cầu xóa tiệm: ${store.name}`
                });
            } catch (logErr) {
                console.warn("Failed to log store soft deletion:", logErr);
            }
        } catch (err) {
            console.error("Error soft deleting store:", err);
            showToast('Lỗi khi xóa tiệm', 'Lỗi', { type: 'error' });
        }
    }, [user]);

    const clearStoreLogs = useCallback(async () => {
        try {
            await firestoreAPI.clearAllStoreLogs();
            showToast('Đã xóa toàn bộ nhật ký', 'Thành công', { type: 'success' });
        } catch (err) {
            console.error("Error clearing store logs:", err);
            showToast('Lỗi khi xóa nhật ký', 'Lỗi', { type: 'error' });
        }
    }, []);

    const restoreStore = useCallback(async (id) => {
        try {
            await firestoreAPI.updateStore(id, {
                deletePending: false,
                deletedBy: null,
                deletedAt: null
            });
            showToast('Đã khôi phục tiệm', 'Thành công', { type: 'success' });

            // Log quietly
            try {
                const targetStore = stores.find(s => s.id === id);
                const storeName = targetStore?.name || 'Unknown Store';

                await firestoreAPI.addStoreLog({
                    action: 'restore',
                    storeName: storeName,
                    userId: user?.id || 'system',
                    userName: user?.name || 'System',
                    details: `Khôi phục tiệm: ${storeName}`
                });
            } catch (logErr) {
                console.warn("Failed to log store restoration:", logErr);
            }
        } catch (err) {
            console.error("Error restoring store:", err);
            showToast('Lỗi khi khôi phục tiệm', 'Lỗi', { type: 'error' });
        }
    }, [user, stores]);

    // Configuration Actions
    const updateTaskStatus = useCallback(async (item) => {
        const isExisting = taskStatuses.some(s => s.id === item.id);
        if (isExisting) {
            setTaskStatuses(prev => prev.map(s => s.id === item.id ? item : s));
            try {
                await firestoreAPI.updateTaskStatus(item);
            } catch (err) {
                console.error("Error updating task status:", err);
            }
        } else {
            const newItem = { ...item, id: item.id || Date.now().toString() }; // Respect UI-provided ID
            setTaskStatuses(prev => [...prev, newItem]);
            try {
                await firestoreAPI.addTaskStatus(newItem);
            } catch (err) {
                console.error("Error adding task status:", err);
            }
        }
    }, [taskStatuses]);

    const updateTaskPriority = useCallback(async (item) => {
        const isExisting = taskPriorities.some(p => p.id === item.id);
        if (isExisting) {
            setTaskPriorities(prev => prev.map(p => p.id === item.id ? item : p));
            try {
                await firestoreAPI.updateTaskPriority(item);
            } catch (err) {
                console.error("Error updating task priority:", err);
            }
        } else {
            const newItem = { ...item, id: item.id || Date.now().toString() };
            setTaskPriorities(prev => [...prev, newItem]);
            try {
                await firestoreAPI.addTaskPriority(newItem);
            } catch (err) {
                console.error("Error adding task priority:", err);
            }
        }
    }, [taskPriorities]);

    const updateTaskType = useCallback(async (item) => {
        const isExisting = taskTypes.some(t => t.id === item.id);
        if (isExisting) {
            setTaskTypes(prev => prev.map(t => t.id === item.id ? item : t));
            try {
                await firestoreAPI.updateTaskType(item);
            } catch (err) {
                console.error("Error updating task type:", err);
            }
        } else {
            const newItem = { ...item, id: item.id || Date.now().toString() };
            setTaskTypes(prev => [...prev, newItem]);
            try {
                await firestoreAPI.addTaskType(newItem);
            } catch (err) {
                console.error("Error adding task type:", err);
            }
        }
    }, [taskTypes]);

    const updateDesignTaskType = useCallback(async (item) => {
        const isExisting = designTaskTypes.some(t => t.id === item.id);
        if (isExisting) {
            setDesignTaskTypes(prev => prev.map(t => t.id === item.id ? item : t));
            try {
                await firestoreAPI.updateDesignTaskType(item);
            } catch (err) {
                console.error("Error updating design task type:", err);
            }
        } else {
            const newItem = { ...item, id: item.id || Date.now().toString() };
            setDesignTaskTypes(prev => [...prev, newItem]);
            try {
                await firestoreAPI.addDesignTaskType(newItem);
            } catch (err) {
                console.error("Error adding design task type:", err);
            }
        }
    }, [designTaskTypes]);

    const updateTeam = useCallback(async (item) => {
        const isExisting = teams.some(t => t.id === item.id);
        if (isExisting) {
            setTeams(prev => prev.map(t => t.id === item.id ? item : t));
            try {
                await firestoreAPI.updateTeam(item);
            } catch (err) {
                console.error("Error updating team:", err);
            }
        } else {
            const newItem = { ...item, id: item.id || Date.now().toString(), order: teams.length };
            setTeams(prev => [...prev, newItem]);
            try {
                await firestoreAPI.addTeam(newItem);
            } catch (err) {
                console.error("Error adding team:", err);
            }
        }
    }, [teams]);

    const updateRole = useCallback(async (item) => {
        const isExisting = roles.some(r => r.id === item.id);
        if (isExisting) {
            setRoles(prev => prev.map(r => r.id === item.id ? item : r));
            try {
                await firestoreAPI.updateRole(item);
            } catch (err) {
                console.error("Error updating role:", err);
            }
        } else {
            const newItem = { ...item, id: item.id || Date.now().toString(), order: roles.length };
            setRoles(prev => [...prev, newItem]);
            try {
                await firestoreAPI.addRole(newItem);
            } catch (err) {
                console.error("Error adding role:", err);
            }
        }
    }, [roles]);

    const deleteConfigItem = useCallback(async (type, id) => {
        try {
            if (type === 'status') {
                setTaskStatuses(prev => prev.filter(i => i.id !== id));
                await firestoreAPI.deleteTaskStatus(id);
            } else if (type === 'priority') {
                setTaskPriorities(prev => prev.filter(i => i.id !== id));
                await firestoreAPI.deleteTaskPriority(id);
            } else if (type === 'type') {
                setTaskTypes(prev => prev.filter(i => i.id !== id));
                await firestoreAPI.deleteTaskType(id);
            } else if (type === 'team') {
                setTeams(prev => prev.filter(i => i.id !== id));
                await firestoreAPI.deleteTeam(id);
            } else if (type === 'role') {
                setRoles(prev => prev.filter(i => i.id !== id));
                await firestoreAPI.deleteRole(id);
            } else if (type === 'designTaskType') {
                setDesignTaskTypes(prev => prev.filter(i => i.id !== id));
                await firestoreAPI.deleteDesignTaskType(id);
            }
        } catch (err) {
            console.error(`Error deleting ${type}:`, err);
        }
    }, []);

    const reorderConfigItems = useCallback((type, startIndex, endIndex) => {
        let list;
        let setter;

        if (type === 'status') {
            list = [...taskStatuses];
            setter = setTaskStatuses;
        } else if (type === 'priority') {
            list = [...taskPriorities];
            setter = setTaskPriorities;
        } else if (type === 'type') {
            list = [...taskTypes];
            setter = setTaskTypes;
        } else if (type === 'team') {
            list = [...teams];
            setter = setTeams;
        } else if (type === 'role') {
            list = [...roles];
            setter = setRoles;
        } else if (type === 'designTaskType') {
            list = [...designTaskTypes];
            setter = setDesignTaskTypes;
        }

        const [removed] = list.splice(startIndex, 1);
        list.splice(endIndex, 0, removed);

        // Update 'order' property for all items to match their new positions
        const reorderedList = list.map((item, index) => ({ ...item, order: index }));

        setter(reorderedList);
    }, [taskStatuses, taskPriorities, taskTypes, teams, roles, designTaskTypes]);

    const saveConfigOrder = useCallback(async (type) => {
        let list;
        let updateApi;

        if (type === 'status') {
            list = taskStatuses;
            updateApi = firestoreAPI.updateTaskStatus;
        } else if (type === 'priority') {
            list = taskPriorities;
            updateApi = firestoreAPI.updateTaskPriority;
        } else if (type === 'type') {
            list = taskTypes;
            updateApi = firestoreAPI.updateTaskType;
        } else if (type === 'team') {
            list = teams;
            updateApi = firestoreAPI.updateTeam;
        } else if (type === 'role') {
            list = roles;
            updateApi = firestoreAPI.updateRole;
        } else if (type === 'knowledgeCategory') {
            list = knowledgeCategories;
            updateApi = firestoreAPI.updateKnowledgeCategory;
        } else if (type === 'designTaskType') {
            list = designTaskTypes;
            updateApi = firestoreAPI.updateDesignTaskType;
        }

        try {
            // json-server doesn't have bulk update, so we update each item
            // This ensures the custom order is saved.
            await Promise.all(list.map(item => updateApi(item)));

        } catch (err) {
            console.error(`Error saving ${type} order:`, err);
        }
    }, [taskStatuses, taskPriorities, taskTypes, teams, roles, designTaskTypes]);

    const contextValue = useMemo(() => ({
        isLoading,
        user,
        login,
        logout,
        checkEmailStatus,
        setPassword,
        settings,
        // updateSettings, // Removed as it was undefined. Use updateSettingsData instead.
        personnel,
        setPersonnel,
        addPersonnel,
        updatePersonnel,
        deletePersonnel,
        canDo,
        tasks,
        setTasks,
        addTask,
        updateTask,
        deleteTask,
        permanentlyDeleteTask,
        restoreTask,
        notifications,
        markNotificationAsRead,
        attendance,
        updateAttendance,
        clearAttendance,
        attendanceHistory,
        addAttendanceHistory,
        storeLogs,
        // Config
        taskStatuses,
        taskPriorities,
        taskTypes,
        teams,
        roles,
        knowledgeCategories,
        updateTaskStatus,
        updateTaskPriority,
        updateTaskType,
        updateTeam,
        updateRole,
        designTaskTypes,
        updateDesignTaskType,
        shiftDefinitions,
        deleteConfigItem,
        reorderConfigItems,
        saveConfigOrder,
        toast,
        setToast,
        showToast,
        welcomeModal,
        setWelcomeModal,
        newKnowledgeModal,
        setNewKnowledgeModal,
        fetchAllData,
        knowledge,
        addKnowledge,
        updateKnowledge,
        deleteKnowledge,
        // Stores
        stores,
        addStore,
        updateStore,
        deleteStore,
        softDeleteStore,
        restoreStore,
        clearStoreLogs,
        updateSettingsData: async (updates) => {
            const currentId = (settings && settings.id) ? settings.id : 'default_settings';
            await firestoreAPI.updateSettings(currentId, updates);
            setSettings(prev => ({ ...prev, ...updates }));
        }
    }), [
        isLoading,
        user,
        login,
        settings,
        personnel,
        tasks,
        notifications,
        attendance,
        attendanceHistory,
        storeLogs,
        taskStatuses,
        taskPriorities,
        taskTypes,
        teams,
        roles,
        knowledgeCategories,
        designTaskTypes,
        shiftDefinitions,
        toast,
        welcomeModal,
        newKnowledgeModal,
        knowledge,
        stores
    ]);

    console.log('AppStateProvider initializing, isLoading:', isLoading);

    return (
        <AppStateContext.Provider value={contextValue}>
            {children}
        </AppStateContext.Provider>
    );
};

export const useAppState = () => {
    const context = useContext(AppStateContext);
    if (!context) {
        throw new Error('useAppState must be used within an AppStateProvider');
    }
    return context;
};
