"use client"

import { useState, useEffect } from "react"
import { API_BASE_URL } from "@/lib/api-config";

export const useAuth = () => {
    const [authToken, setAuthToken] = useState<string | null>(null)
    const [apiUrl] = useState<string>(API_BASE_URL)

    useEffect(() => {
        // Retrieve the token and API URL from localStorage on component mount
        const storedToken = localStorage.getItem("authToken")
        if (storedToken) {
            setAuthToken(storedToken)
        }
    }, [])

    // Function to set the token and store it in localStorage
    const setToken = (token: string) => {
        setAuthToken(token)
        localStorage.setItem("authToken", token)
    }

    // Function to remove the token from state and localStorage
    const removeToken = () => {
        setAuthToken(null)
        localStorage.removeItem("authToken")
    }

    return {
        authToken,
        apiUrl,
        setToken,
        removeToken,
    }
}
