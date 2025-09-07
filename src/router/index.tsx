import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Home, Splash } from "../Pages";

const Stack = createNativeStackNavigator();

const Router = () => {
    return (
        <Stack.Navigator>
            <Stack.Screen 
                name="Home"
                component={Home}
                options={{ headerShown: false}}
            />

            <Stack.Screen 
                name="Splash"
                component={Splash}
                options={{ headerShown: false}}
            />
        </Stack.Navigator>
    )
}

export default Router;