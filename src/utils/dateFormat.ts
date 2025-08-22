export const formatDate = (date: Date | string): string => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();

    // Nếu trong vòng 1 phút
    if (diff < 60000) {
        return 'Vừa xong';
    }

    // Nếu trong vòng 1 giờ
    if (diff < 3600000) {
        const minutes = Math.floor(diff / 60000);
        return `${minutes} phút trước`;
    }

    // Nếu trong vòng 24 giờ
    if (diff < 86400000) {
        const hours = Math.floor(diff / 3600000);
        return `${hours} giờ trước`;
    }

    // Nếu trong vòng 7 ngày
    if (diff < 604800000) {
        const days = Math.floor(diff / 86400000);
        return `${days} ngày trước`;
    }

    // Nếu lâu hơn, hiện ngày tháng
    return d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
};
