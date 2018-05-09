//
//  main.cpp
//  yandex.test
//
//  Created by Тимур Фатыхов on 06/04/2018.
//  Copyright © 2018 Fatykhov. All rights reserved.
//

#include <iostream>
#include <fstream>
#include <set>
#include <vector>
#include <algorithm>
#include <bitset>

#define filename1 "/Users/timur89833239972/Documents/Projects/Xcode projects/Yandex/yandex.test/yandex.test/input.unicCount.txt"
#define filename2 "/Users/timur89833239972/Documents/Projects/Xcode projects/Yandex/yandex.test/yandex.test/input.top5.txt"

using namespace std;

// return count of different numbers in array
unsigned long uniqCount(){
    clock_t begin = clock(); // timer
    set<int> mySet;
    
    ifstream in(filename1);
    int n;
    in >> n;    // count of numbers
    
    int item;   // var for input numbers
    
    for(int i = 0; i < n; i++){
        in >> item;
        mySet.insert(item);
    }
    clock_t end = clock();
    cout<< "Time uniq count: " << double(end - begin) / CLOCKS_PER_SEC << " millisec\n";
    
    return mySet.size();
}

void fiveMin(){
    typedef vector<int>::iterator vecIt;
    
    clock_t begin = clock();
    
    // initialize vector
    vector<int> myVec;
    
    // stream for output
    ofstream out("/Users/timur89833239972/Documents/Projects/Xcode projects/Yandex/yandex.test/yandex.test/output.txt");
    
    // read number of row
    ifstream in(filename2);
    int n;
    in >> n;
    
    // readable item
    int item;
    
    for(int i = 0; i < 5 && i < n; i++){
        in >> item;
        myVec.push_back(item);
        sort(myVec.begin(), myVec.end());
        
        for(vecIt it = myVec.end() - 1; it != myVec.begin() - 1; it--){
            out << *it << " ";
        }
        out << endl;
    }
    
    for(int i = 0; i < n - 5; i++){
        in >> item;
        myVec.push_back(item);
        sort(myVec.begin(), myVec.end());
        
        for(vecIt it = myVec.begin() + 4; it != myVec.begin() - 1; it--){
            out << *it << " ";
        }
        
        myVec.pop_back();
        out << endl;
    }
    
    clock_t end = clock();
    cout << "Time top5: " << double(end - begin) / CLOCKS_PER_SEC << " millisec\n";
    in.close();
}


unsigned long degreesOfTwo(){
    unsigned long x;
    cin >> x;
    cout << "Entered: " << x <<endl;
    
    std::string binary = std::bitset<51>(x).to_string();
    cout << binary << endl;
    
    int firstOne = 0;
    firstOne = int(binary.find_first_of("1"));
    
    return binary.length() - firstOne;
}

bool decompose(int x, int l1, int r1, int l2, int r2){
    if (x > r1 + r2 || x < l1 + l2){
        cout << "-1" << endl;
        return false;
    }
    
    if (x - r2 >= l1){
        printf("%d = %d + %d\n", x, x - r2 ,r2);
        return true;
    }
    
    printf("%d = %d + %d\n", x, l1 , x - l1);
    
    return true;
}

int main(int argc, const char * argv[]) {
    unsigned long size = uniqCount();
    std::cout << "Size of uniq set: " << size << endl << endl;

    fiveMin();
    
//    cout << degreesOfTwo() << endl;

    int x = -13,
    l1 = -40,
    r1 = -30,
    l2 = 17,
    r2 = 30;
    decompose(x, l1, r1, l2, r2);
    
    return 0;
}

