import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SessionState {
    user: any | null;
    token: string | null;
}

const initialState: SessionState = {
    user: null,
    token: null,
};

const sessionSlice = createSlice({
    name: 'session',
    initialState,
    reducers: {
        setSession: (
            state,
            action: PayloadAction<{ user: any; token: string }>
        ) => {
            state.user = action.payload.user;
            state.token = action.payload.token;
        },
        clearSession: (state) => {
            state.user = null;
            state.token = null;
        },
    },
});

export const { setSession, clearSession } = sessionSlice.actions;
export default sessionSlice.reducer;
